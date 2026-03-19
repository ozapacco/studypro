import { db } from "../db.js";
import { scheduler } from "./scheduler.js";

export const TUTOR_MODE = {
  PASSIVE: "passive",
  ACTIVE: "active",
  STRICT: "strict",
};

export const PROFICIENCY_THRESHOLD = {
  STRONG: 0.85,
  WEAK: 0.6,
  CRITICAL: 0.4,
};

export class TutorEngine {
  async decideNextMission() {
    const config = await db.config.get(1);
    const mode = config?.tutor?.mode || TUTOR_MODE.ACTIVE;
    const today = new Date();

    const [subjects, dueCards] = await Promise.all([
      db.subjects.toArray(),
      scheduler.getDueCards(),
    ]);

    const urgentCards = dueCards.filter((c) => {
      const overdue = (today.getTime() - new Date(c.due).getTime()) / 86400000;
      return overdue > 1 || c.state === "learning" || c.state === "relearning";
    });

    if (urgentCards.length > 0) {
      const urgentTopic = await db.topics.get(urgentCards[0].topicId);
      const urgentSubject = urgentTopic
        ? await db.subjects.get(urgentTopic.subjectId)
        : null;
      return {
        type: "urgent",
        topic: urgentTopic,
        subject: urgentSubject,
        reason: `Voce tem ${urgentCards.length} card(s) urgente(s) em ${urgentTopic?.name || "topico desconhecido"}`,
        mandatory: true,
        blockType: "urgent_review",
        cardIds: urgentCards.slice(0, 20).map((c) => c.id),
        estimatedMinutes: Math.min(urgentCards.length * 2, 25),
        mode,
        mastery: null,
        masteryLevel: "urgente",
      };
    }

    const subjectMastery = await this.calculateSubjectMastery(subjects);
    const weakSubjects = subjectMastery.filter(
      (s) => s.retention < PROFICIENCY_THRESHOLD.STRONG * 100,
    );

    let focus;
    if (mode === TUTOR_MODE.STRICT && weakSubjects.length > 0) {
      focus = await this.getStrictFocus(weakSubjects);
    }

    if (!focus) {
      focus = await this.getROIFocus(subjectMastery, config);
    }

    if (!focus) {
      return {
        type: "rest",
        topic: null,
        subject: null,
        reason:
          "Voce esta em dia com todas as revisoes. Que tal estudar uma materia nova?",
        mandatory: false,
        blockType: null,
        cardIds: [],
        estimatedMinutes: 0,
        mode,
        mastery: null,
        masteryLevel: "neutro",
      };
    }

    const topicCards = focus.topicId
      ? await db.cards.where("topicId").equals(focus.topicId).toArray()
      : [];
    const dueForTopic = dueCards.filter((c) => c.topicId === focus.topicId);
    const newForTopic = topicCards
      .filter((c) => c.state === "new")
      .slice(0, 10);

    return {
      type: focus.actionType,
      topic: focus.topic,
      subject: focus.subject,
      reason: focus.reason,
      mandatory: mode !== TUTOR_MODE.PASSIVE,
      blockType: this.actionToBlockType(focus.actionType),
      cardIds: [
        ...dueForTopic.map((c) => c.id),
        ...newForTopic.map((c) => c.id),
      ],
      estimatedMinutes: this.estimateTime(
        focus.topic,
        dueForTopic,
        newForTopic,
      ),
      mode,
      mastery: focus.retention,
      masteryLevel: this.getMasteryLabel(focus.retention),
    };
  }

  async calculateSubjectMastery(subjects) {
    return Promise.all(
      subjects.map(async (subject) => {
        const cards = await db.cards
          .where("subjectId")
          .equals(subject.id)
          .toArray();
        const reviewCards = cards.filter(
          (c) => c.state === "review" && c.lastReview,
        );
        const totalCards = cards.length;
        const nonNewCards = cards.filter((c) => c.state !== "new").length;

        const matureCards = reviewCards.filter((c) => (c.stability || 0) > 21);
        const retention =
          reviewCards.length > 0 ? matureCards.length / reviewCards.length : 0;

        const totalCorrect = reviewCards.reduce(
          (s, c) => s + (c.stats?.correctCount || 0),
          0,
        );
        const totalReviewed = reviewCards.reduce(
          (s, c) => s + (c.stats?.totalReviews || 0),
          0,
        );
        const accuracy = totalReviewed > 0 ? totalCorrect / totalReviewed : 0;

        const coverage = totalCards > 0 ? nonNewCards / totalCards : 0;

        const domainScore = Math.round(
          (retention * 0.4 + accuracy * 0.4 + coverage * 0.2) * 100,
        );

        return {
          id: subject.id,
          name: subject.name,
          color: subject.color,
          weight: subject.weight || 1,
          retention: Math.round(retention * 100),
          accuracy: Math.round(accuracy * 100),
          coverage: Math.round(coverage * 100),
          domainScore,
          totalCards,
          matureCards: matureCards.length,
          weak: retention < PROFICIENCY_THRESHOLD.STRONG,
          critical: retention < PROFICIENCY_THRESHOLD.CRITICAL,
        };
      }),
    );
  }

  async getStrictFocus(weakSubjects) {
    if (weakSubjects.length === 0) return null;
    const weakest = [...weakSubjects].sort(
      (a, b) => a.retention - b.retention,
    )[0];
    const subject = await db.subjects.get(weakest.id);
    const topics = await db.topics
      .where("subjectId")
      .equals(subject.id)
      .toArray();

    if (topics.length === 0) return null;

    const topic = topics.sort(
      (a, b) => (b.importance || 1) - (a.importance || 1),
    )[0];

    return {
      topicId: topic.id,
      topic,
      subject,
      retention: weakest.retention,
      reason:
        weakest.retention < 40
          ? `Critico: ${subject.name} esta em apenas ${weakest.retention}% de dominio. Foco maximo aqui.`
          : `${subject.name} esta em ${weakest.retention}% de dominio. Foco ate atingir 85%.`,
      actionType: weakest.retention < 40 ? "urgent" : "review",
    };
  }

  async getROIFocus(subjectMastery, config) {
    const examDate = new Date(
      config?.targetExam?.date || new Date(Date.now() + 180 * 86400000),
    );
    const daysLeft = Math.max(1, (examDate.getTime() - Date.now()) / 86400000);
    const urgency = Math.min(1, 90 / daysLeft);

    const withROI = subjectMastery
      .filter((s) => s.totalCards > 0 || s.retention < 85)
      .map((s) => {
        const growthPotential = 1 - s.retention / 100;
        const roi =
          ((s.weight || 1) * growthPotential * (1 + urgency)) /
          Math.max(1, s.totalCards / 20);
        return { ...s, roi };
      })
      .sort((a, b) => b.roi - a.roi);

    const best = withROI[0];
    if (!best) return null;

    const subject = await db.subjects.get(best.id);
    const topics = await db.topics
      .where("subjectId")
      .equals(subject.id)
      .toArray();

    if (topics.length === 0) return null;

    const topic = topics.sort(
      (a, b) => (b.importance || 1) - (a.importance || 1),
    )[0];

    return {
      topicId: topic.id,
      topic,
      subject,
      retention: best.retention,
      reason: this.buildReason(best, urgency, daysLeft),
      actionType: best.retention < 60 ? "review" : "new",
    };
  }

  buildReason(subject, urgency, daysLeft) {
    if (subject.retention < 40)
      return `CRITICO: ${subject.name} esta em apenas ${subject.retention}% de dominio. Urgencia maxima.`;
    if (subject.retention < 60)
      return `${subject.name} precisa de atencao — ${subject.retention}% de dominio atual.`;
    if ((subject.weight || 1) >= 0.3 && urgency > 0.5)
      return `${subject.name} tem peso alto no concurso e prazo apertado. ROI ideal agora.`;
    return `${subject.name} — dominio em ${subject.retention}%. Proximo passo ideal.`;
  }

  actionToBlockType(actionType) {
    const map = {
      urgent: "urgent_review",
      review: "review",
      new: "new_content",
    };
    return map[actionType] || "review";
  }

  estimateTime(topic, dueCards, newCards) {
    const urgentTime =
      dueCards.filter(
        (c) =>
          c.state === "learning" ||
          c.state === "relearning" ||
          (new Date(c.due).getTime() - Date.now()) / 86400000 < -1,
      ).length * 2;
    const reviewTime =
      dueCards.filter((c) => c.state === "review").length * 1.5;
    const newTime = newCards.length * 3;
    return Math.min(60, Math.max(10, urgentTime + reviewTime + newTime));
  }

  getMasteryLabel(retention) {
    if (retention >= 85) return "forte";
    if (retention >= 60) return "medio";
    if (retention >= 40) return "fraco";
    return "critico";
  }

  async recalculateAfterSession(sessionResult) {
    const next = await this.decideNextMission();
    await db.config.update(1, {
      tutor: {
        ...((await db.config.get(1))?.tutor || {}),
        lastMission: next,
        lastRecalcAt: new Date().toISOString(),
      },
    });
    return next;
  }

  async setMode(mode) {
    await db.config.update(1, {
      tutor: {
        ...((await db.config.get(1))?.tutor || {}),
        mode,
      },
    });
  }

  async getMode() {
    const config = await db.config.get(1);
    return config?.tutor?.mode || TUTOR_MODE.ACTIVE;
  }

  /**
   * Checks if a topic study is pedagogically blocked (e.g. 24h consolidation rule).
   * @param {number} topicId 
   * @returns {Promise<{blocked: boolean, reason?: string, type?: string}>}
   */
  async checkPedagogicalBlock(topicId) {
    const config = await db.config.get(1);
    const mode = config?.tutor?.mode || TUTOR_MODE.ACTIVE;
    
    // If passive mode, no blocks
    if (mode === TUTOR_MODE.PASSIVE) return { blocked: false };

    const topic = await db.topics.get(topicId);
    if (!topic) return { blocked: false };

    const cards = await db.cards.where('topicId').equals(topicId).toArray();
    const reviewLogs = await db.reviewLogs.where('cardId').anyOf(cards.map(c => c.id)).toArray();
    
    if (reviewLogs.length === 0) return { blocked: false };

    // Get the most recent review time for this topic
    const lastReviewTime = Math.max(...reviewLogs.map(l => new Date(l.timestamp).getTime()));
    const now = Date.now();
    const hoursSinceLastReview = (now - lastReviewTime) / 3600000;

    // RULE: Consolidation Block (Min 18h for Active, 24h for Strict)
    const minHours = mode === TUTOR_MODE.STRICT ? 24 : 18;
    
    if (hoursSinceLastReview < minHours) {
      const remaining = Math.ceil(minHours - hoursSinceLastReview);
      return {
        blocked: true,
        type: 'consolidation',
        reason: `Bloqueio de Consolidação: Sua última sessão foi há ${Math.round(hoursSinceLastReview)}h. Espere mais ${remaining}h para permitir que seu cérebro termine a síntese proteica necessária para a memória de longo prazo.`
      };
    }

    return { blocked: false };
  }
}

export const tutorEngine = new TutorEngine();
