import { db } from "../db.js";
import { fsrs } from "../fsrs/fsrs.js";

export class Analytics {
  async getPeriodStats(startDate, endDate) {
    const stats = await db.dailyStats
      .where("date")
      .between(startDate, endDate, true, true)
      .toArray();
    if (stats.length === 0) return null;

    return {
      days: stats.length,
      totalTime: stats.reduce((sum, item) => sum + (item.time?.actual || 0), 0),
      totalCards: stats.reduce(
        (sum, item) => sum + (item.cards?.reviewed || 0),
        0,
      ),
      totalNew: stats.reduce(
        (sum, item) => sum + (item.cards?.newLearned || 0),
        0,
      ),
      avgRetention:
        stats.reduce(
          (sum, item) => sum + (item.performance?.correctRate || 0),
          0,
        ) / stats.length,
      avgTimePerDay:
        stats.reduce((sum, item) => sum + (item.time?.actual || 0), 0) /
        stats.length,
      streakDays: this.calculateStreak(stats),
      trend: this.calculateTrend(stats),
    };
  }

  calculateStreak(stats) {
    const sorted = [...stats].sort((a, b) => b.date.localeCompare(a.date));
    let streak = 0;
    let expected = new Date().toISOString().split("T")[0];

    for (const stat of sorted) {
      if (stat.date === expected && (stat.time?.actual || 0) > 0) {
        streak += 1;
        const prev = new Date(expected);
        prev.setDate(prev.getDate() - 1);
        expected = prev.toISOString().split("T")[0];
      } else if (stat.date < expected) {
        break;
      }
    }

    return streak;
  }

  calculateTrend(stats) {
    if (stats.length < 7) return "insufficient_data";

    const sorted = [...stats].sort((a, b) => a.date.localeCompare(b.date));
    const recent = sorted.slice(-7);
    const previous = sorted.slice(-14, -7);
    if (previous.length < 7) return "insufficient_data";

    const recentAvg =
      recent.reduce(
        (sum, item) => sum + (item.performance?.correctRate || 0),
        0,
      ) / 7;
    const prevAvg =
      previous.reduce(
        (sum, item) => sum + (item.performance?.correctRate || 0),
        0,
      ) / 7;
    const diff = recentAvg - prevAvg;

    if (diff > 0.05) return "improving";
    if (diff < -0.05) return "declining";
    return "stable";
  }

  async projectPassProbability() {
    const config = await db.config.get(1);
    const subjects = await db.subjects.toArray();

    if (subjects.length === 0) {
      return {
        projectedScore: 0,
        passProbability: 0,
        bySubject: [],
        daysUntilExam: null,
        recommendation:
          "Adicione pelo menos uma materia para iniciar as projecoes.",
      };
    }

    const projected = await Promise.all(
      subjects.map(async (subject) => {
        const cards = await db.cards
          .where("subjectId")
          .equals(subject.id)
          .toArray();
        const mature = cards.filter(
          (card) => card.state === "review" && card.lastReview,
        );

        if (mature.length === 0) {
          return {
            subject,
            projectedScore: 0.5,
            coverage: 0,
            confidence: "low",
          };
        }

        const examDate = new Date(
          config?.targetExam?.date || new Date(Date.now() + 120 * 86400000),
        );
        let totalRetention = 0;

        for (const card of mature) {
          const elapsed =
            (examDate.getTime() - new Date(card.lastReview).getTime()) /
            86400000;
          totalRetention += fsrs.retrievability(card.stability || 1, elapsed);
        }

        const avgRetention = totalRetention / mature.length;
        return {
          subject,
          projectedScore: avgRetention * 0.95,
          coverage: mature.length / Math.max(1, cards.length),
          confidence:
            mature.length > 30 ? "high" : mature.length > 10 ? "medium" : "low",
        };
      }),
    );

    let weightedScore = 0;
    let totalWeight = 0;

    for (const item of projected) {
      weightedScore += item.projectedScore * (item.subject.weight || 0);
      totalWeight += item.subject.weight || 0;
    }

    const finalScore = totalWeight === 0 ? 0 : weightedScore / totalWeight;
    const cutoff = 0.65;
    const margin = finalScore - cutoff;

    let passProbability = 0.1;
    if (margin > 0.15) passProbability = 0.9;
    else if (margin > 0.1) passProbability = 0.8;
    else if (margin > 0.05) passProbability = 0.65;
    else if (margin > 0) passProbability = 0.5;
    else if (margin > -0.05) passProbability = 0.35;
    else if (margin > -0.1) passProbability = 0.2;

    return {
      projectedScore: Math.round(finalScore * 100),
      passProbability: Math.round(passProbability * 100),
      bySubject: projected.map((item) => ({
        name: item.subject.name,
        score: Math.round(item.projectedScore * 100),
        coverage: Math.round(item.coverage * 100),
        confidence: item.confidence,
      })),
      daysUntilExam: config?.targetExam?.date
        ? Math.ceil(
            (new Date(config.targetExam.date).getTime() -
              new Date().getTime()) /
              86400000,
          )
        : null,
      recommendation: this.getProjectionRecommendation(
        finalScore,
        passProbability,
      ),
    };
  }

  getProjectionRecommendation(score, probability) {
    if (probability >= 0.8)
      return "Otima trajetoria. Mantenha consistencia e as revisoes.";
    if (probability >= 0.6)
      return "Boa trajetoria. Intensifique as materias fracas.";
    if (probability >= 0.4)
      return "Atencao necessaria. Ajuste a estrategia e o foco.";
    return "Risco alto. Aumente o ritmo e reequilibre seu plano.";
  }

  async getEditalCoverage() {
    const { tutorEngine } = await import("./tutorEngine.js");
    const subjects = await db.subjects.toArray();
    const mastery = await tutorEngine.calculateSubjectMastery(subjects);

    const totalWeight = subjects.reduce((s, sub) => s + (sub.weight || 0), 0);
    const weightedScore = mastery.reduce((sum, sub) => {
      return sum + (sub.domainScore * (sub.weight || 0)) / 100;
    }, 0);

    const config = await db.config.get(1);
    const examDate = config?.targetExam?.date || null;
    let daysLeft = null;
    if (examDate) {
      daysLeft = Math.ceil(
        (new Date(examDate).getTime() - new Date().getTime()) / 86400000,
      );
    }

    return {
      overall: Math.round(weightedScore),
      subjects: mastery,
      examDate,
      daysLeft,
      criticalCount: mastery.filter((s) => s.critical).length,
      weakCount: mastery.filter((s) => s.weak && !s.critical).length,
      strongCount: mastery.filter((s) => s.domainScore >= 85).length,
    };
  }

  /**
   * Retrieves card review counts for the last 365 days for consistency mapping.
   * @returns {Promise<Array<{date: string, count: number, level: number}>>}
   */
  async getConsistencyData() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 365);

    const stats = await db.dailyStats
      .where("date")
      .between(start.toISOString().split('T')[0], end.toISOString().split('T')[0], true, true)
      .toArray();

    return stats.map(s => {
      const count = s.cards?.reviewed || 0;
      let level = 0;
      if (count > 0) level = 1;
      if (count > 30) level = 2;
      if (count > 60) level = 3;
      if (count > 100) level = 4;
      
      return {
        date: s.date,
        count,
        level
      };
    });
  }

  /**
   * Analyzes efficiency (accuracy vs. speed) grouped by the hour of the day.
   * @returns {Promise<Array<{hour: number, accuracy: number, avgTime: number, total: number}>>}
   */
  async getEfficiencyAnalysis() {
    const logs = await db.reviewLogs.toArray();
    const clusters = Array.from({ length: 24 }, (_, i) => ({ 
      hour: i, 
      correct: 0, 
      total: 0, 
      time: 0 
    }));

    for (const log of logs) {
      const date = new Date(log.timestamp);
      const h = date.getHours();
      clusters[h].total++;
      clusters[h].time += log.responseTime || 15000;
      if (log.rating >= 2) clusters[h].correct++;
    }

    return clusters.map(c => ({
      hour: c.hour,
      accuracy: c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0,
      avgTime: c.total > 0 ? Math.round((c.time / c.total) / 1000) : 0,
      total: c.total
    }));
  }
}

export const analytics = new Analytics();
