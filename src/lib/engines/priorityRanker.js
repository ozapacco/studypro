import { db } from '../db.js';

export class PriorityRanker {
  async rankSubjects() {
    const subjects = await db.subjects.toArray();
    const config = await db.config.get(1);

    const ranked = await Promise.all(
      subjects.map(async (subject) => {
        const score = await this.calculateSubjectROI(subject, config);
        return { ...subject, ...score };
      })
    );

    return ranked.sort((a, b) => b.roi - a.roi);
  }

  async calculateSubjectROI(subject, config) {
    const stats = subject.stats || { matureCards: 0, totalCards: 0, averageEase: 5 };
    const weight = (subject.weight || 0) / 100;
    const proficiency = stats.totalCards > 0 ? stats.matureCards / stats.totalCards : 0;
    const growthPotential = 1 - proficiency;

    const avgDifficulty = (stats.averageEase || 5) / 10;

    const examDate = new Date(config?.targetExam?.date || new Date(Date.now() + 180 * 86400000));
    const daysUntilExam = Math.max(1, (examDate.getTime() - new Date().getTime()) / 86400000);
    const urgency = Math.min(1, 90 / daysUntilExam);

    const impact = weight * growthPotential * (1 + urgency);
    const cost = 0.3 + avgDifficulty * 0.7;
    const roi = impact / cost;

    return {
      roi: Math.round(roi * 100) / 100,
      impact: Math.round(impact * 100) / 100,
      cost: Math.round(cost * 100) / 100,
      growthPotential: Math.round(growthPotential * 100),
      urgency: Math.round(urgency * 100),
      recommendation: this.getRecommendation(roi, growthPotential, urgency)
    };
  }

  getRecommendation(roi, growth, urgency) {
    if (roi > 1.5 && urgency > 0.7) return 'Prioridade maxima';
    if (roi > 1.2) return 'Prioridade alta';
    if (growth < 0.2) return 'Modo manutencao';
    if (roi < 0.5) return 'Prioridade baixa';
    return 'Prioridade normal';
  }

  async rankTopics(subjectId) {
    const topics = await db.topics.where('subjectId').equals(subjectId).toArray();

    const ranked = await Promise.all(
      topics.map(async (topic) => {
        const [totalCards, matureCards] = await Promise.all([
          db.cards.where('topicId').equals(topic.id).count(),
          db.cards.where('topicId').equals(topic.id).filter(c => (c.stability || 0) > 21).count()
        ]);

        const retention = totalCards > 0 ? matureCards / totalCards : 0;
        const score = (topic.importance || 1) * (1 - retention);

        return {
          ...topic,
          score: Math.round(score * 100) / 100,
          retention: Math.round(retention * 100),
          matureCards,
          totalCards
        };
      })
    );

    return ranked.sort((a, b) => b.score - a.score);
  }

  async identifyGaps() {
    const subjects = await this.rankSubjects();
    const gaps = [];

    for (const subject of subjects) {
      if (subject.growthPotential <= 50) continue;
      const topics = await this.rankTopics(subject.id);
      const critical = topics.filter((topic) => topic.retention < 60 && (topic.importance || 0) >= 4);
      if (critical.length === 0) continue;

      gaps.push({
        subject: subject.name,
        subjectId: subject.id,
        severity: subject.roi > 1 ? 'high' : 'medium',
        topics: critical.slice(0, 3).map((topic) => ({
          name: topic.name,
          retention: topic.retention,
          importance: topic.importance
        }))
      });
    }

    const order = { high: 0, medium: 1, low: 2 };
    return gaps.sort((a, b) => order[a.severity] - order[b.severity]);
  }
}

export const priorityRanker = new PriorityRanker();
