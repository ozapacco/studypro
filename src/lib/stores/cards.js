import { writable } from 'svelte/store';
import { db } from '../db.js';

function createCardsStore() {
  const { subscribe, update } = writable({
    cards: [],
    loading: false,
    filters: {
      subjectId: null,
      topicId: null,
      state: null,
      searchQuery: ''
    },
    sort: {
      field: 'due',
      direction: 'asc'
    },
    dueToday: []
  });

  return {
    subscribe,

    async load(filters = {}) {
      update((state) => ({ ...state, loading: true }));

      let query = /** @type {any} */ (db.cards);
      const subjectId = filters.subjectId ? Number(filters.subjectId) : null;
      const topicId = filters.topicId ? Number(filters.topicId) : null;
      if (subjectId) query = query.where('subjectId').equals(subjectId);
      let cards = await query.toArray();

      if (topicId) cards = cards.filter((card) => card.topicId === topicId);
      if (filters.state) cards = cards.filter((card) => card.state === filters.state);

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        cards = cards.filter((card) => {
          const question = card.content?.question?.toLowerCase() || '';
          const front = card.content?.front?.toLowerCase() || '';
          return question.includes(q) || front.includes(q);
        });
      }

      const now = new Date().toISOString();
      const dueToday = cards.filter((card) => card.due && card.due <= now);

      update((state) => ({
        ...state,
        cards,
        filters: { ...state.filters, ...filters },
        loading: false,
        dueToday
      }));
    },

    async add(cardData) {
      const card = {
        ...cardData,
        state: 'new',
        stability: 0,
        difficulty: 5,
        due: new Date().toISOString(),
        reps: 0,
        lapses: 0,
        lastReview: null,
        lastRating: null,
        suspended: false,
        buried: false,
        flagged: false,
        stats: {
          totalReviews: 0,
          correctCount: 0,
          incorrectCount: 0,
          averageTime: 0,
          streak: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const id = await db.cards.add(card);
      update((state) => ({ ...state, cards: [...state.cards, { ...card, id }] }));
      await this.updateSubjectStats(card.subjectId);
      return id;
    },

    async getById(id) {
      return db.cards.get(Number(id));
    },

    async update(id, changes) {
      const payload = { ...changes, updatedAt: new Date().toISOString() };
      await db.cards.update(id, payload);
      update((state) => ({
        ...state,
        cards: state.cards.map((card) => (card.id === id ? { ...card, ...payload } : card))
      }));
    },

    async remove(id) {
      const card = await db.cards.get(id);
      await db.cards.delete(id);
      update((state) => ({ ...state, cards: state.cards.filter((item) => item.id !== id) }));
      if (card?.subjectId) await this.updateSubjectStats(card.subjectId);
    },

    async toggleSuspend(id) {
      const card = await db.cards.get(id);
      if (!card) return;
      await this.update(id, { suspended: !card.suspended });
    },

    async bury(id) {
      await this.update(id, { buried: true });
    },

    async unburyAll() {
      await db.cards.where('buried').equals(1).modify((card) => {
        /** @type {any} */ (card).buried = false;
      });
      await this.load();
    },

    async reset(id) {
      await this.update(id, {
        state: 'new',
        stability: 0,
        difficulty: 5,
        due: new Date().toISOString(),
        reps: 0,
        lapses: 0,
        lastReview: null,
        lastRating: null
      });
    },

    async updateSubjectStats(subjectId) {
      if (!subjectId) return;

      const [total, mature, learning, newCount, reviewCount, nonLapsedReviewCount, totalDifficulty] = await Promise.all([
        db.cards.where('subjectId').equals(subjectId).count(),
        db.cards.where('subjectId').equals(subjectId).filter((c) => (c.stability || 0) > 21).count(),
        db.cards.where('subjectId').equals(subjectId).filter((c) => c.state === 'learning' || c.state === 'relearning').count(),
        db.cards.where('subjectId').equals(subjectId).filter((c) => c.state === 'new').count(),
        db.cards.where('subjectId').equals(subjectId).filter((c) => c.state === 'review').count(),
        db.cards.where('subjectId').equals(subjectId).filter((c) => c.state === 'review' && (c.lapses || 0) === 0).count(),
        // Para a dificuldade média, ainda precisamos iterar, mas usamos .each para não carregar tudo na RAM
        (async () => {
          let sum = 0;
          let count = 0;
          await db.cards.where('subjectId').equals(subjectId).each((card) => {
            sum += card.difficulty || 5;
            count++;
          });
          return { sum, count };
        })()
      ]);

      const stats = {
        totalCards: total,
        matureCards: mature,
        learningCards: learning,
        newCards: newCount,
        averageEase: totalDifficulty.count > 0 ? totalDifficulty.sum / totalDifficulty.count : 5,
        retention: reviewCount > 0 ? nonLapsedReviewCount / reviewCount : 0
      };

      await db.subjects.update(subjectId, { stats });
    },

    /**
     * Updates subject stats specifically for a card review (incremental)
     */
    async recordCardReview(subjectId, difficultyDelta, wasNew, wasMature, isMature) {
      if (!subjectId) return;
      const subject = await db.subjects.get(subjectId);
      if (!subject) return;

      const stats = subject.stats || {
        totalCards: 0,
        matureCards: 0,
        learningCards: 0,
        newCards: 0,
        averageEase: 5,
        retention: 0
      };

      // Update difficulty average
      const totalDiff = (stats.averageEase || 5) * stats.totalCards + difficultyDelta;
      stats.averageEase = stats.totalCards > 0 ? totalDiff / stats.totalCards : stats.averageEase;

      if (wasNew) stats.newCards = Math.max(0, stats.newCards - 1);
      if (!wasMature && isMature) stats.matureCards++;
      if (wasMature && !isMature) stats.matureCards = Math.max(0, stats.matureCards - 1);

      await db.subjects.update(subjectId, { stats });
    },

    async recalculateAllSubjectStats() {
      const subjectIds = await db.subjects.toCollection().primaryKeys();
      await Promise.all(subjectIds.map((subjectId) => this.updateSubjectStats(subjectId)));
    },

    async import(data, subjectId, topicId) {
      const now = new Date().toISOString();
      const cards = data.map((item) => ({
        topicId,
        subjectId,
        type: item.type || 'question',
        content: item.content,
        state: 'new',
        stability: 0,
        difficulty: 5,
        due: now,
        reps: 0,
        lapses: 0,
        createdAt: now,
        updatedAt: now
      }));

      await db.cards.bulkAdd(cards);
      await this.load({ subjectId });
      await this.updateSubjectStats(subjectId);
      return cards.length;
    }
  };
}

export const cardsStore = createCardsStore();
