import { writable, derived, get } from "svelte/store";
import { db } from "../db.js";
import { FSRS } from "../fsrs/fsrs.js";
import { configStore } from "./config.js";
import { cardsStore } from "./cards.js";
import { tutorEngine } from "../engines/tutorEngine.js";

function createSessionStore() {
  const initial = {
    session: null,
    currentBlockIndex: 0,
    currentCard: null,
    cardStartTime: null,
    showingAnswer: false,
    cardQueue: [],
    queuePosition: 0,
    stats: {
      cardsReviewed: 0,
      correctCount: 0,
      incorrectCount: 0,
      totalTime: 0,
      ratings: { 1: 0, 2: 0, 3: 0, 4: 0 },
    },
    isPaused: false,
    isComplete: false,
  };

  const { subscribe, set, update } = writable(initial);

  async function loadQueueByIds(ids = []) {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const cards = await db.cards.bulkGet(ids);
    const validCards = cards.filter(Boolean);

    // Enrich with subject and topic names (parallel lookups)
    const subjectIds = [
      ...new Set(validCards.map((c) => c.subjectId).filter(Boolean)),
    ];
    const topicIds = [
      ...new Set(validCards.map((c) => c.topicId).filter(Boolean)),
    ];
    const [subjects, topics] = await Promise.all([
      db.subjects.bulkGet(subjectIds),
      db.topics.bulkGet(topicIds),
    ]);
    const subjectMap = new Map(
      subjects.filter(Boolean).map((s) => [s.id, s.name]),
    );
    const topicMap = new Map(topics.filter(Boolean).map((t) => [t.id, t.name]));

    const byId = new Map(
      validCards.map((card) => [
        card.id,
        {
          ...card,
          subjectName: subjectMap.get(card.subjectId) || null,
          topicName: topicMap.get(card.topicId) || null,
        },
      ]),
    );
    return ids.map((id) => byId.get(id)).filter(Boolean);
  }

  function getBlockCardIds(session, blockIndex) {
    const block = session?.plan?.blocks?.[blockIndex];
    const cards = block?.cards || [];
    return cards
      .map((item) => (typeof item === "object" ? item.id : item))
      .filter(Boolean);
  }

  async function loadBlockQueue(session, blockIndex) {
    const ids = getBlockCardIds(session, blockIndex);
    if (ids.length > 0) return loadQueueByIds(ids);

    const block = session?.plan?.blocks?.[blockIndex];
    return block?.cards || [];
  }

  function snapshotRuntime(state) {
    return {
      currentBlockIndex: state.currentBlockIndex,
      queuePosition: state.queuePosition,
      showingAnswer: state.showingAnswer,
      isPaused: state.isPaused,
      isComplete: state.isComplete,
      cardQueueIds: state.cardQueue.map((card) => card.id).filter(Boolean),
      stats: state.stats,
      updatedAt: new Date().toISOString(),
    };
  }

  async function persistProgress(state) {
    if (!state.session?.id) return;
    await db.sessions.update(state.session.id, {
      status: state.isComplete ? "in_progress" : "in_progress",
      runtime: snapshotRuntime(state),
      execution: {
        reviewsDone: state.stats.cardsReviewed,
        correctAnswers: state.stats.correctCount,
        incorrectAnswers: state.stats.incorrectCount,
        totalActiveTime: Math.round(state.stats.totalTime / 60000),
      },
    });
  }

  return {
    subscribe,

    async start(session) {
      const queue = await loadBlockQueue(session, 0);

      set({
        ...initial,
        session,
        cardQueue: queue,
        currentCard: queue[0] || null,
        cardStartTime: Date.now(),
      });

      if (session.id) {
        await db.sessions.update(session.id, {
          status: "in_progress",
          actualStartTime:
            session.actualStartTime || new Date().toTimeString().slice(0, 5),
        });
        await persistProgress(get({ subscribe }));
      }
    },

    async resumeFromSession(session) {
      const runtime = session.runtime || {};
      const currentBlockIndex = runtime.currentBlockIndex || 0;
      const runtimeIds = runtime.cardQueueIds || [];
      const queue =
        runtimeIds.length > 0
          ? await loadQueueByIds(runtimeIds)
          : await loadBlockQueue(session, currentBlockIndex);

      const queuePositionRaw = runtime.queuePosition || 0;
      const queuePosition =
        queue.length === 0 ? 0 : Math.min(queuePositionRaw, queue.length - 1);
      const currentCard = queue[queuePosition] || null;

      set({
        ...initial,
        session,
        currentBlockIndex,
        cardQueue: queue,
        queuePosition,
        currentCard,
        cardStartTime: currentCard ? Date.now() : null,
        showingAnswer: Boolean(runtime.showingAnswer),
        isPaused: Boolean(runtime.isPaused),
        isComplete: Boolean(runtime.isComplete),
        stats: runtime.stats || initial.stats,
      });

      if (session.id) {
        await db.sessions.update(session.id, { status: "in_progress" });
      }
    },

    showAnswer() {
      update((state) => ({ ...state, showingAnswer: true }));
      persistProgress(get({ subscribe }));
    },

    async answer(rating) {
      const state = get({ subscribe });
      if (!state.currentCard) return;

      const responseTime = Date.now() - state.cardStartTime;
      const card = state.currentCard;

      const config = get(configStore);
      const engine = new FSRS(config?.fsrsParams || {});
      const result = engine.review(card, rating);

      const difficultyDelta = (result.difficulty || 5) - (card.difficulty || 5);
      const wasNew = card.state === "new";
      const wasMature = (card.stability || 0) > 21;
      const isMature = (result.stability || 0) > 21;

      await db.cards.update(card.id, {
        ...result,
        stats: {
          ...card.stats,
          totalReviews: (card.stats?.totalReviews || 0) + 1,
          correctCount: (card.stats?.correctCount || 0) + (rating >= 2 ? 1 : 0),
          incorrectCount:
            (card.stats?.incorrectCount || 0) + (rating < 2 ? 1 : 0),
          averageTime: Math.round(
            ((card.stats?.averageTime || 0) * (card.stats?.totalReviews || 0) +
              responseTime) /
              ((card.stats?.totalReviews || 0) + 1),
          ),
          streak: rating >= 2 ? (card.stats?.streak || 0) + 1 : 0,
        },
      });

      await cardsStore.recordCardReview(
        card.subjectId,
        difficultyDelta,
        wasNew,
        wasMature,
        isMature,
      );

      const updatedCard = await db.cards.get(card.id);

      await db.reviewLogs.add({
        cardId: card.id,
        timestamp: new Date().toISOString(),
        rating,
        stateBefore: card.state,
        stateAfter: result.state,
        responseTime,
        intervalBefore: card.lastInterval || 0,
        intervalAfter: result.lastInterval,
        stabilityBefore: card.stability,
        stabilityAfter: result.stability,
        difficultyBefore: card.difficulty,
        difficultyAfter: result.difficulty,
        sessionId: state.session?.id,
      });

      const xp = this.calculateXP(rating, responseTime, card);
      await configStore.addXP(xp);

      update((s) => {
        const nextPosition = s.queuePosition + 1;
        const nextCard = s.cardQueue[nextPosition] || null;
        const patchedQueue = s.cardQueue.map((item) =>
          item.id === updatedCard.id ? updatedCard : item,
        );

        return {
          ...s,
          cardQueue: patchedQueue,
          queuePosition: nextPosition,
          currentCard: nextCard,
          cardStartTime: nextCard ? Date.now() : null,
          showingAnswer: false,
          stats: {
            cardsReviewed: s.stats.cardsReviewed + 1,
            correctCount: s.stats.correctCount + (rating >= 2 ? 1 : 0),
            incorrectCount: s.stats.incorrectCount + (rating < 2 ? 1 : 0),
            totalTime: s.stats.totalTime + responseTime,
            ratings: {
              ...s.stats.ratings,
              [rating]: s.stats.ratings[rating] + 1,
            },
          },
        };
      });

      const newState = get({ subscribe });
      if (!newState.currentCard) {
        await this.nextBlock();
      } else {
        await persistProgress(newState);
      }
    },

    calculateXP(rating, responseTime, card) {
      let xp = 10;
      if (rating === 4) xp += 5;
      else if (rating === 3) xp += 2;
      else if (rating === 1) xp -= 3;
      if (responseTime < 10000) xp += 3;
      if ((card.stats?.streak || 0) > 5) xp += 2;
      return Math.max(1, xp);
    },

    async nextBlock() {
      const state = get({ subscribe });
      const nextIndex = state.currentBlockIndex + 1;
      const nextBlock = state.session?.plan?.blocks?.[nextIndex];

      if (!nextBlock) {
        update((current) => ({
          ...current,
          isComplete: true,
          currentCard: null,
          cardQueue: [],
          queuePosition: 0,
        }));
        await persistProgress(get({ subscribe }));
        return;
      }

      const queue = await loadBlockQueue(state.session, nextIndex);

      update((current) => ({
        ...current,
        currentBlockIndex: nextIndex,
        cardQueue: queue,
        queuePosition: 0,
        currentCard: queue[0] || null,
        cardStartTime: queue[0] ? Date.now() : null,
        showingAnswer: false,
      }));

      await persistProgress(get({ subscribe }));
    },

    pause() {
      update((state) => ({ ...state, isPaused: true }));
      persistProgress(get({ subscribe }));
    },

    resume() {
      update((state) => ({
        ...state,
        isPaused: false,
        cardStartTime: Date.now(),
      }));
      persistProgress(get({ subscribe }));
    },

    async finish() {
      const state = get({ subscribe });
      if (!state.session?.id) {
        set(initial);
        return;
      }

      await db.sessions.update(state.session.id, {
        status: "completed",
        runtime: null,
        actualEndTime: new Date().toTimeString().slice(0, 5),
        execution: {
          reviewsDone: state.stats.cardsReviewed,
          correctAnswers: state.stats.correctCount,
          incorrectAnswers: state.stats.incorrectCount,
          totalActiveTime: Math.round(state.stats.totalTime / 60000),
        },
      });

      const today = new Date().toISOString().split("T")[0];
      const existing = await db.dailyStats.where("date").equals(today).first();

      if (existing) {
        await db.dailyStats.update(existing.id, {
          cards: {
            ...existing.cards,
            reviewed:
              (existing.cards?.reviewed || 0) + state.stats.cardsReviewed,
          },
          time: {
            ...existing.time,
            actual:
              (existing.time?.actual || 0) +
              Math.round(state.stats.totalTime / 60000),
          },
          performance: {
            correctRate:
              ((existing.performance?.correctRate || 0) +
                state.stats.correctCount /
                  Math.max(1, state.stats.cardsReviewed)) /
              2,
          },
        });
      } else {
        await db.dailyStats.add({
          date: today,
          cards: { reviewed: state.stats.cardsReviewed, newLearned: 0 },
          time: { actual: Math.round(state.stats.totalTime / 60000) },
          performance: {
            correctRate:
              state.stats.correctCount / Math.max(1, state.stats.cardsReviewed),
          },
        });
      }

      await this.checkStreak();
      set(initial);
    },

    async finishWithRecalc() {
      const state = get({ subscribe });

      if (!state.session?.id) {
        set(initial);
        return null;
      }

      await db.sessions.update(state.session.id, {
        status: "completed",
        runtime: null,
        actualEndTime: new Date().toTimeString().slice(0, 5),
        execution: {
          reviewsDone: state.stats.cardsReviewed,
          correctAnswers: state.stats.correctCount,
          incorrectAnswers: state.stats.incorrectCount,
          totalActiveTime: Math.round(state.stats.totalTime / 60000),
        },
      });

      const today = new Date().toISOString().split("T")[0];
      const existing = await db.dailyStats.where("date").equals(today).first();

      if (existing) {
        await db.dailyStats.update(existing.id, {
          cards: {
            ...existing.cards,
            reviewed:
              (existing.cards?.reviewed || 0) + state.stats.cardsReviewed,
          },
          time: {
            ...existing.time,
            actual:
              (existing.time?.actual || 0) +
              Math.round(state.stats.totalTime / 60000),
          },
          performance: {
            correctRate:
              ((existing.performance?.correctRate || 0) +
                state.stats.correctCount /
                  Math.max(1, state.stats.cardsReviewed)) /
              2,
          },
        });
      } else {
        await db.dailyStats.add({
          date: today,
          cards: { reviewed: state.stats.cardsReviewed, newLearned: 0 },
          time: { actual: Math.round(state.stats.totalTime / 60000) },
          performance: {
            correctRate:
              state.stats.correctCount / Math.max(1, state.stats.cardsReviewed),
          },
        });
      }

      await this.checkStreak();

      const result = {
        correct: state.stats.correctCount,
        incorrect: state.stats.incorrectCount,
        totalTime: state.stats.totalTime,
        cardsReviewed: state.stats.cardsReviewed,
      };

      let nextMission = null;
      try {
        nextMission = await tutorEngine.recalculateAfterSession(result);
      } catch (e) {
        console.error("Tutor recalc error:", e);
      }

      set(initial);
      return nextMission;
    },

    async checkStreak() {
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];
      const yesterdayStats = await db.dailyStats
        .where("date")
        .equals(yesterday)
        .first();

      if (yesterdayStats && (yesterdayStats.cards?.reviewed || 0) > 0) {
        await configStore.incrementStreak();
      } else {
        await configStore.resetStreak();
        await configStore.incrementStreak();
      }
    },

    handleKeyboard(event) {
      const state = get({ subscribe });
      if (state.isPaused) return;

      if (
        !state.showingAnswer &&
        (event.code === "Space" || event.code === "Enter")
      ) {
        event.preventDefault();
        this.showAnswer();
        return;
      }

      if (
        state.showingAnswer &&
        ["Digit1", "Digit2", "Digit3", "Digit4"].includes(event.code)
      ) {
        event.preventDefault();
        this.answer(parseInt(event.code.slice(-1), 10));
        return;
      }

      const keyMap = { KeyJ: 1, KeyK: 2, KeyL: 3, Semicolon: 4 };
      if (state.showingAnswer && keyMap[event.code]) {
        event.preventDefault();
        this.answer(keyMap[event.code]);
      }
    },

    reset() {
      set(initial);
    },
  };
}

export const sessionStore = createSessionStore();

export const currentBlock = derived(
  sessionStore,
  ($session) => $session.session?.plan?.blocks?.[$session.currentBlockIndex],
);

export const progress = derived(sessionStore, ($session) => ({
  current: $session.queuePosition,
  total: $session.cardQueue.length,
  percentage:
    $session.cardQueue.length > 0
      ? Math.round(($session.queuePosition / $session.cardQueue.length) * 100)
      : 0,
}));

export const sessionStats = derived(sessionStore, ($session) => $session.stats);
