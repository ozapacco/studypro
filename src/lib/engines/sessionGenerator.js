import { db } from "../db.js";
import { scheduler } from "./scheduler.js";
import { interleaver } from "./interleaver.js";
import { tutorEngine, TUTOR_MODE } from "./tutorEngine.js";
import { adaptiveAllocator } from "./adaptiveAllocator.js";

export class SessionGenerator {
  async generateDailySession(options = {}) {
    const { forceTopicId = null } = options;
    const config = await db.config.get(1);
    const tutorMode = config?.tutor?.mode || TUTOR_MODE.ACTIVE;
    const today = new Date();
    const dayOfWeek = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ][today.getDay()];

    const availableMinutes =
      (config?.schedule?.dailyDistribution?.[dayOfWeek] || 0) * 60;
    if (availableMinutes <= 0) return this.createRestDaySession();

    // STRICT MODE: Generate focused session on weak subject
    if (forceTopicId) {
      return this.generateFocusedSession(forceTopicId, availableMinutes);
    }

    if (tutorMode === TUTOR_MODE.STRICT) {
      try {
        const mission = await tutorEngine.decideNextMission();
        if (mission?.topic?.id && mission.type !== "rest") {
          return this.generateFocusedSession(
            mission.topic.id,
            availableMinutes,
            mission,
          );
        }
      } catch (e) {
        console.error("Tutor strict mode error:", e);
      }
    }

    const [dueCards, newCardsAvailable, subjects, queueStats] =
      await Promise.all([
        scheduler.getDueCards(),
        scheduler.getNewCards({ respectDailyLimit: true }),
        db.subjects.toArray(),
        scheduler.getQueueStats(),
      ]);

    const mastery = await tutorEngine.calculateSubjectMastery(subjects);
    const allocInfo = await adaptiveAllocator.allocate(
      availableMinutes,
      mastery,
    );
    const time = allocInfo.allocation;
    const blocks = [];

    // ─────────────────────────────────────────────────────────
    // BLOCO 1: Revisões urgentes
    // ─────────────────────────────────────────────────────────
    if (time.urgentReviews > 0) {
      const urgentCards = dueCards.filter((card) => {
        const overdueDays =
          (today.getTime() - new Date(card.due).getTime()) / 86400000;
        return (
          overdueDays > 1 ||
          card.state === "learning" ||
          card.state === "relearning"
        );
      });

      if (urgentCards.length > 0) {
        blocks.push({
          type: "urgent_review",
          title: "Revisões Urgentes",
          description: "Cards atrasados e em aprendizado",
          durationMinutes: time.urgentReviews,
          cards: interleaver.interleaveCards(urgentCards),
          estimatedCards: Math.min(
            urgentCards.length,
            Math.floor(time.urgentReviews * 2),
          ),
        });
      }
    }

    // ─────────────────────────────────────────────────────────
    // BLOCO 2: Conteúdo novo (Multi-matéria)
    // ─────────────────────────────────────────────────────────
    if (time.newContent > 0) {
      const lessons = await this.getMultipleNextLessons(subjects, 3);
      if (lessons.length > 0) {
        const totalDuration = time.newContent;
        const perLessonDuration = Math.floor(totalDuration / lessons.length);

        for (const lesson of lessons) {
          blocks.push({
            type: "new_content",
            title: `Conteúdo Novo: ${lesson.subjectName}`,
            description: lesson.lessonTitle,
            durationMinutes: perLessonDuration,
            lessonId: lesson.lessonId,
            topicId: lesson.topicId,
            subjectId: lesson.subjectId,
            newCards: newCardsAvailable
              .filter((c) => c.topicId === lesson.topicId)
              .slice(0, 10),
          });
        }
      }
    }

    // ─────────────────────────────────────────────────────────
    // BLOCO 3: Revisões regulares
    // ─────────────────────────────────────────────────────────
    if (time.reviews > 0) {
      const regularCards = dueCards.filter((card) => card.state === "review");
      if (regularCards.length > 0) {
        blocks.push({
          type: "review",
          title: "Revisões do Dia",
          description: "Manutenção da memória de longo prazo",
          durationMinutes: time.reviews,
          cards: interleaver.interleaveCards(regularCards),
          estimatedCards: Math.min(
            regularCards.length,
            Math.floor(time.reviews * 2),
          ),
        });
      }
    }

    // ─────────────────────────────────────────────────────────
    // BLOCO 4: Questões (Multi-matéria)
    // ─────────────────────────────────────────────────────────
    if (time.questions > 0) {
      const weakSubjects = await this.getWeakestSubjects(subjects, 2);
      if (weakSubjects.length > 0) {
        const totalDuration = time.questions;
        const perSubjectDuration = Math.floor(
          totalDuration / weakSubjects.length,
        );

        for (const subject of weakSubjects) {
          const weakTopic = await db.topics
            .where("subjectId")
            .equals(subject.id)
            .first();
          blocks.push({
            type: "questions",
            title: `Questões: ${subject.name}`,
            description: weakTopic
              ? `Foco: ${weakTopic.name}`
              : "Prática ativa de questões focada em fraquezas",
            durationMinutes: perSubjectDuration,
            subjectId: subject.id,
            topicId: weakTopic?.id || null,
            topicName: weakTopic?.name || null,
            targetCount: Math.floor(perSubjectDuration * 1.5),
          });
        }
      }
    }

    // ─────────────────────────────────────────────────────────
    // BLOCO 5: Consolidação
    // ─────────────────────────────────────────────────────────
    if (time.encoding > 0) {
      blocks.push({
        type: "encoding",
        title: "Consolidação Final",
        description: "Recapitulação rápida antes de encerrar a sessão",
        durationMinutes: time.encoding,
        activities: [
          "Revisar anotações",
          "Atualizar resumo",
          "Listar dúvidas pendentes",
        ],
      });
    }

    const session = {
      date: today.toISOString().split("T")[0],
      status: "planned",
      plannedStartTime: config?.schedule?.preferredStartTime || "06:00",
      plan: {
        totalMinutes: availableMinutes,
        blocks,
      },
      execution: {
        reviewsDone: 0,
        newCardsDone: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        totalActiveTime: 0,
      },
      createdAt: new Date().toISOString(),
    };

    const id = await db.sessions.add(session);
    return { ...session, id };
  }

  async allocateTime(totalMinutes, queueStats, subjects = []) {
    if (subjects.length > 0) {
      const mastery = await tutorEngine.calculateSubjectMastery(subjects);
      const allocInfo = await adaptiveAllocator.allocate(totalMinutes, mastery);
      return allocInfo.allocation;
    }

    const urgentCount =
      (queueStats.overdue || 0) +
      (queueStats.learning || 0) +
      (queueStats.relearning || 0);
    const reviewCount = queueStats.review || 0;

    const allocation = {
      urgentReviews: 0,
      newContent: 0,
      reviews: 0,
      questions: 0,
      encoding: 0,
    };

    let remaining = totalMinutes;
    allocation.encoding = Math.min(15, Math.floor(remaining * 0.08));
    remaining -= allocation.encoding;

    if (urgentCount > 0) {
      const urgentTime = Math.min(
        Math.ceil(urgentCount / 2),
        Math.floor(remaining * 0.25),
      );
      allocation.urgentReviews = urgentTime;
      remaining -= urgentTime;
    }

    if (reviewCount > 50) {
      allocation.reviews = Math.floor(remaining * 0.5);
      allocation.newContent = Math.floor(remaining * 0.25);
      allocation.questions =
        remaining - allocation.reviews - allocation.newContent;
    } else {
      allocation.newContent = Math.floor(remaining * 0.35);
      allocation.reviews = Math.floor(remaining * 0.35);
      allocation.questions =
        remaining - allocation.newContent - allocation.reviews;
    }

    return allocation;
  }

  async getMultipleNextLessons(subjects, limit = 3) {
    const lessons = [];
    const subjectsWithPriority = subjects
      .map((s) => ({
        ...s,
        priority: (s.weight || 1) * (1 - (s.proficiencyLevel || 0) / 100),
      }))
      .sort((a, b) => b.priority - a.priority);

    for (const subject of subjectsWithPriority) {
      if (lessons.length >= limit) break;

      const topics = await db.topics
        .where("subjectId")
        .equals(subject.id)
        .toArray();
      if (topics.length === 0) continue;

      const topicIds = topics.map((topic) => topic.id);
      const lesson = await db.lessons
        .where("completed")
        .equals(0)
        .and((item) => topicIds.includes(item.topicId))
        .first();

      if (lesson) {
        const topic = topics.find((item) => item.id === lesson.topicId);
        lessons.push({
          lessonId: lesson.id,
          lessonTitle: lesson.title || "Aula sem titulo",
          topicId: topic.id,
          topicName: topic.name,
          subjectId: subject.id,
          subjectName: subject.name,
        });
      }
    }
    return lessons;
  }

  async getWeakestSubjects(subjects, limit = 2) {
    if (subjects.length === 0) return [];

    const withRetention = await Promise.all(
      subjects.map(async (subject) => {
        const cards = await db.cards
          .where("subjectId")
          .equals(subject.id)
          .toArray();
        const reviewCards = cards.filter(
          (card) => card.state === "review" && card.lastReview,
        );
        if (reviewCards.length < 5) return { ...subject, retention: 1 };

        const avg =
          reviewCards.reduce((sum, card) => {
            const elapsed =
              (Date.now() - new Date(card.lastReview).getTime()) / 86400000;
            return sum + Math.pow(0.9, elapsed / (card.stability || 1));
          }, 0) / reviewCards.length;

        return { ...subject, retention: avg };
      }),
    );

    return withRetention
      .sort((a, b) => a.retention - b.retention)
      .slice(0, limit);
  }

  createRestDaySession() {
    return {
      date: new Date().toISOString().split("T")[0],
      status: "rest_day",
      plan: {
        totalMinutes: 0,
        blocks: [],
        message: "Dia de descanso",
      },
    };
  }

  /**
   * Returns a prioritized list of topics for the day (Missão Diária).
   * Each item has: topicId, topicName, subjectId, subjectName, subjectColor,
   *   actionType ('new'|'review'|'urgent'), cardCount, dueCount.
   */
  async getDailyMission(limit = 5) {
    const today = new Date();
    const [subjects, dueCards, newCards] = await Promise.all([
      db.subjects.toArray(),
      db.cards
        .where("state")
        .anyOf(["learning", "review", "relearning"])
        .toArray(),
      db.cards.where("state").equals("new").toArray(),
    ]);

    if (subjects.length === 0) return [];

    const mastery = await tutorEngine.calculateSubjectMastery(subjects);
    const masteryMap = new Map(mastery.map((s) => [s.id, s]));

    // Score each topic across all subjects
    const topicScores = [];

    for (const subject of subjects) {
      const topics = await db.topics
        .where("subjectId")
        .equals(subject.id)
        .toArray();
      if (topics.length === 0) continue;

      for (const topic of topics) {
        const topicDueCards = dueCards.filter((c) => c.topicId === topic.id);
        const topicNewCards = newCards.filter((c) => c.topicId === topic.id);

        const urgentCards = topicDueCards.filter((c) => {
          const overdueDays =
            (today.getTime() - new Date(c.due).getTime()) / 86400000;
          return (
            overdueDays > 0 ||
            c.state === "learning" ||
            c.state === "relearning"
          );
        });

        const reviewCards = topicDueCards.filter((c) => c.state === "review");

        if (
          urgentCards.length === 0 &&
          reviewCards.length === 0 &&
          topicNewCards.length === 0
        )
          continue;

        // Determine action type and score
        let actionType = "new";
        let score = 0;

        const subjectMastery = masteryMap.get(subject.id);

        if (urgentCards.length > 0) {
          actionType = "urgent";
          score = 1000 + urgentCards.length * 10 + (subject.weight || 1) * 20;
          if (subjectMastery?.critical) score += 500;
        } else if (reviewCards.length > 0) {
          actionType = "review";
          score = 500 + reviewCards.length * 5 + (subject.weight || 1) * 20;
          if (subjectMastery?.weak) score += 100;
        } else {
          actionType = "new";
          score = 100 + (subject.weight || 1) * 20;
        }

        const retention = subjectMastery?.retention || 0;
        const masteryLevel = subjectMastery
          ? tutorEngine.getMasteryLabel(retention)
          : "desconhecido";

        topicScores.push({
          topicId: topic.id,
          topicName: topic.name,
          subjectId: subject.id,
          subjectName: subject.name,
          subjectColor: subject.color || "#6366f1",
          subjectWeight: subject.weight || 1,
          actionType,
          score,
          urgentCount: urgentCards.length,
          reviewCount: reviewCards.length,
          newCount: topicNewCards.length,
          totalDue: urgentCards.length + reviewCards.length,
          retention,
          domainScore: subjectMastery?.domainScore || 0,
          masteryLevel,
          accuracy: subjectMastery?.accuracy || 0,
          coverage: subjectMastery?.coverage || 0,
          critical: subjectMastery?.critical || false,
          weak: subjectMastery?.weak || false,
        });
      }
    }

    // Sort by score descending
    topicScores.sort((a, b) => b.score - a.score);

    // Interleave by subject (avoid consecutive same subject)
    const result = [];
    const used = new Set();
    let lastSubjectId = null;

    while (result.length < limit && topicScores.length > 0) {
      // Find best candidate that is not the same subject as last
      let candidateIdx = topicScores.findIndex(
        (t) => !used.has(t.topicId) && t.subjectId !== lastSubjectId,
      );
      if (candidateIdx === -1) {
        candidateIdx = topicScores.findIndex((t) => !used.has(t.topicId));
      }
      if (candidateIdx === -1) break;

      const item = topicScores[candidateIdx];
      result.push(item);
      used.add(item.topicId);
      lastSubjectId = item.subjectId;
    }

    return result;
  }

  /**
   * Returns health status per subject for the health panel.
   */
  async getSubjectHealthPanel() {
    const subjects = await db.subjects.toArray();
    const allCards = await db.cards.toArray();
    const today = new Date();

    return subjects.map((subject) => {
      const cards = allCards.filter((c) => c.subjectId === subject.id);
      const total = cards.length;
      if (total === 0)
        return { ...subject, health: "none", coverage: 0, overdue: 0 };

      const reviewCards = cards.filter(
        (c) => c.state === "review" && c.lastReview,
      );
      const overdueCards = cards.filter(
        (c) => c.due && new Date(c.due) < today && c.state !== "new",
      );
      const coverage = Math.round(
        ((total - cards.filter((c) => c.state === "new").length) / total) * 100,
      );

      // Estimate avg retention
      let avgRetention = 1;
      if (reviewCards.length > 0) {
        avgRetention =
          reviewCards.reduce((sum, card) => {
            const elapsed =
              (Date.now() - new Date(card.lastReview).getTime()) / 86400000;
            return sum + Math.pow(0.9, elapsed / (card.stability || 1));
          }, 0) / reviewCards.length;
      }

      const health =
        overdueCards.length > 5 || avgRetention < 0.6
          ? "critical"
          : overdueCards.length > 2 || avgRetention < 0.75
            ? "warning"
            : "healthy";

      return {
        id: subject.id,
        name: subject.name,
        color: subject.color || "#6366f1",
        weight: subject.weight || 1,
        health,
        coverage,
        overdue: overdueCards.length,
        avgRetention: Math.round(avgRetention * 100),
        totalCards: total,
      };
    });
  }

  async generateFocusedSession(topicId, availableMinutes, mission = null) {
    const topic = await db.topics.get(topicId);
    if (!topic) return this.createRestDaySession();

    const subject = await db.subjects.get(topic.subjectId);
    const dueCards = await scheduler.getDueCards({
      subjectIds: [topic.subjectId],
    });
    const newCardsAvailable = await scheduler.getNewCards({
      subjectId: topic.subjectId,
      respectDailyLimit: true,
    });

    const urgentCards = dueCards.filter(
      (c) =>
        c.topicId === topicId &&
        (c.state === "learning" ||
          c.state === "relearning" ||
          (new Date(c.due).getTime() - Date.now()) / 86400000 < -1),
    );
    const reviewCards = dueCards.filter(
      (c) => c.topicId === topicId && c.state === "review",
    );
    const newCards = newCardsAvailable
      .filter((c) => c.topicId === topicId)
      .slice(0, 15);

    const blocks = [];
    const urgentTime = Math.min(
      urgentCards.length * 2,
      Math.floor(availableMinutes * 0.3),
    );
    const reviewTime = Math.min(
      reviewCards.length * 1.5,
      Math.floor(availableMinutes * 0.35),
    );
    const newTime = Math.min(
      newCards.length * 3,
      Math.floor(availableMinutes * 0.25),
    );
    const consolidationTime = Math.min(15, Math.floor(availableMinutes * 0.1));

    if (urgentCards.length > 0) {
      blocks.push({
        type: "urgent_review",
        title: `Urgente: ${topic.name}`,
        description: `${urgentCards.length} card(s) urgente(s)`,
        durationMinutes: urgentTime,
        cards: interleaver.interleaveCards(urgentCards),
        estimatedCards: Math.min(
          urgentCards.length,
          Math.floor(urgentTime * 2),
        ),
      });
    }

    if (reviewCards.length > 0) {
      blocks.push({
        type: "review",
        title: `Revisao: ${topic.name}`,
        description: `${reviewCards.length} cards para revisar`,
        durationMinutes: reviewTime,
        cards: interleaver.interleaveCards(reviewCards),
        estimatedCards: Math.min(
          reviewCards.length,
          Math.floor(reviewTime * 2),
        ),
      });
    }

    if (newCards.length > 0) {
      blocks.push({
        type: "new_content",
        title: `Novo: ${topic.name}`,
        description: `${newCards.length} cards novos`,
        durationMinutes: newTime,
        lessonId: null,
        topicId,
        subjectId: topic.subjectId,
        newCards,
      });
    }

    if (consolidationTime > 0) {
      blocks.push({
        type: "encoding",
        title: "Consolidacao",
        description: "Recapitule o que aprendeu",
        durationMinutes: consolidationTime,
        activities: [
          "Revisar anotaes",
          "Listar dvidas pendentes",
          "Atualizar bizus",
        ],
      });
    }

    const session = {
      date: new Date().toISOString().split("T")[0],
      status: "planned",
      plan: {
        totalMinutes: availableMinutes,
        blocks,
        focusMission: mission
          ? {
              topicId: mission.topic?.id,
              topicName: mission.topic?.name,
              subjectName: mission.subject?.name,
              reason: mission.reason,
              type: mission.type,
            }
          : null,
      },
      execution: {
        reviewsDone: 0,
        newCardsDone: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        totalActiveTime: 0,
      },
      createdAt: new Date().toISOString(),
    };

    const id = await db.sessions.add(session);
    return { ...session, id };
  }
}

export const sessionGenerator = new SessionGenerator();
