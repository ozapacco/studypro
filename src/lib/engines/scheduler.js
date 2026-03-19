import { db } from '../db.js';
import { State } from '../fsrs/states.js';

export class Scheduler {
  async getDueCards(options = {}) {
    const { subjectIds = null, limit = null, excludeBuried = true, excludeSuspended = true } = options;

    const now = new Date().toISOString();
    let collection = db.cards.where('due').belowOrEqual(now);

    if (excludeBuried) collection = collection.and((card) => !card.buried);
    if (excludeSuspended) collection = collection.and((card) => !card.suspended);

    let cards = await collection.toArray();

    if (subjectIds) {
      cards = cards.filter((card) => subjectIds.includes(card.subjectId));
    }

    cards = this.sortByPriority(cards);
    if (limit) cards = cards.slice(0, limit);
    return cards;
  }

  async getNewCards(options = {}) {
    const { subjectId = null, limit = 20, respectDailyLimit = true } = options;

    let remaining = limit;
    if (respectDailyLimit) {
      const config = await db.config.get(1);
      const today = new Date().toISOString().split('T')[0];
      const todayStats = await db.dailyStats.where('date').equals(today).first();
      if (todayStats && config?.preferences?.newCardsPerDay) {
        remaining = Math.max(0, config.preferences.newCardsPerDay - (todayStats.cards?.newLearned || 0));
      }
    }

    if (remaining <= 0) return [];

    const cards = subjectId
      ? await db.cards.where('[subjectId+state]').equals([subjectId, State.NEW])
          .and((c) => !c.buried && !c.suspended)
          .limit(remaining)
          .toArray()
      : await db.cards.where('state').equals(State.NEW)
          .and((c) => !c.buried && !c.suspended)
          .limit(remaining)
          .toArray();

    return cards.sort((a, b) => {
      if (a.topicId !== b.topicId) return a.topicId - b.topicId;
      return a.id - b.id;
    });
  }

  async getLearningCards() {
    const now = new Date().toISOString();
    return db.cards
      .where('state')
      .anyOf([State.LEARNING, State.RELEARNING])
      .and((card) => card.due <= now && !card.buried && !card.suspended)
      .toArray();
  }

  sortByPriority(cards) {
    const now = new Date();

    return cards.sort((a, b) => {
      if (a.state !== b.state) {
        const stateOrder = { learning: 0, relearning: 1, review: 2 };
        return (stateOrder[a.state] ?? 3) - (stateOrder[b.state] ?? 3);
      }

      const aOverdue = (now.getTime() - new Date(a.due).getTime()) / 86400000;
      const bOverdue = (now.getTime() - new Date(b.due).getTime()) / 86400000;

      if (Math.abs(aOverdue - bOverdue) > 1) {
        return bOverdue - aOverdue;
      }

      return (b.difficulty || 0) - (a.difficulty || 0);
    });
  }

  async getQueueStats() {
    const now = new Date();
    const nowISO = now.toISOString();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const endOfDayISO = endOfDay.toISOString();

    const [buried, suspended, states, timings] = await Promise.all([
      db.cards.where('buried').equals(1).count(),
      db.cards.where('suspended').equals(1).count(),
      Promise.all([
        db.cards.where('state').equals(State.NEW).and(c => !c.buried && !c.suspended).count(),
        db.cards.where('state').equals(State.LEARNING).and(c => !c.buried && !c.suspended).count(),
        db.cards.where('state').equals(State.REVIEW).and(c => !c.buried && !c.suspended).count(),
        db.cards.where('state').equals(State.RELEARNING).and(c => !c.buried && !c.suspended).count(),
      ]),
      Promise.all([
        db.cards.where('due').belowOrEqual(nowISO).and(c => !c.buried && !c.suspended && c.state !== State.NEW).count(),
        db.cards.where('due').between(nowISO, endOfDayISO, false, true).and(c => !c.buried && !c.suspended && c.state !== State.NEW).count()
      ])
    ]);

    return {
      new: states[0],
      learning: states[1],
      review: states[2],
      relearning: states[3],
      overdue: timings[0],
      dueToday: timings[1],
      buried,
      suspended
    };
  }

  async estimateStudyTime() {
    const dueCards = await this.getDueCards();
    const learningCards = await this.getLearningCards();

    const avgTime = { review: 15, learning: 30, relearning: 25 };
    let totalSeconds = 0;

    for (const card of [...dueCards, ...learningCards]) {
      totalSeconds += avgTime[card.state] || 20;
    }

    return {
      cards: dueCards.length + learningCards.length,
      estimatedMinutes: Math.ceil(totalSeconds / 60),
      breakdown: {
        reviews: dueCards.length,
        learning: learningCards.length
      }
    };
  }

  /**
   * Predicts number of cards due for the upcoming X days based on current stored 'due' dates.
   * @param {number} days - Number of days to project
   * @returns {Promise<Array<{date: string, count: number}>>}
   */
  async getFutureWorkload(days = 14) {
    const now = new Date();
    const result = [];
    
    // Check cards with due between start and end of each future day
    for (let i = 1; i <= days; i++) {
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + i);
      
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const count = await db.cards
        .where('due')
        .between(startOfDay.toISOString(), endOfDay.toISOString(), true, true)
        .and(c => !c.buried && !c.suspended)
        .count();

      result.push({
        date: targetDate.toISOString().split('T')[0],
        count
      });
    }

    return result;
  }
}

export const scheduler = new Scheduler();
