import { DEFAULT_PARAMS, FSRS_CONSTANTS } from './params.js';
import { State, Rating } from './states.js';

export class FSRS {
  constructor(params = {}) {
    this.w = params.w || DEFAULT_PARAMS.w;
    this.requestRetention = params.requestRetention || DEFAULT_PARAMS.requestRetention;
    this.maximumInterval = params.maximumInterval || DEFAULT_PARAMS.maximumInterval;
    this.enableFuzz = params.enableFuzz ?? DEFAULT_PARAMS.enableFuzz;
  }

  retrievability(stability, elapsedDays) {
    if (stability <= 0) return 0;
    const { DECAY, FACTOR } = FSRS_CONSTANTS;
    return Math.pow(1 + (FACTOR * elapsedDays) / stability, DECAY);
  }

  nextInterval(stability) {
    const { DECAY, FACTOR } = FSRS_CONSTANTS;
    const interval = (stability / FACTOR) * (Math.pow(this.requestRetention, 1 / DECAY) - 1);
    const bounded = Math.min(Math.max(Math.round(interval), 1), this.maximumInterval);
    return this.enableFuzz ? this.applyFuzz(bounded) : bounded;
  }

  applyFuzz(interval) {
    if (interval < 3) return interval;
    const fuzz = 1 + (Math.random() * 0.1 - 0.05);
    return Math.max(1, Math.round(interval * fuzz));
  }

  initStability(rating) {
    return Math.max(this.w[rating - 1], FSRS_CONSTANTS.MIN_STABILITY);
  }

  nextStabilitySuccess(difficulty, stability, retrievability, rating) {
    const hardPenalty = rating === Rating.HARD ? this.w[11] : 1;
    const easyBonus = rating === Rating.EASY ? this.w[16] : 1;

    const next =
      stability *
      (1 +
        Math.exp(this.w[8]) *
          (11 - difficulty) *
          Math.pow(stability, -this.w[9]) *
          (Math.exp((1 - retrievability) * this.w[10]) - 1) *
          hardPenalty *
          easyBonus);

    return Math.max(next, FSRS_CONSTANTS.MIN_STABILITY);
  }

  nextStabilityFail(difficulty, stability, retrievability) {
    const next =
      this.w[12] *
      Math.pow(difficulty, -this.w[13]) *
      (Math.pow(stability + 1, this.w[14]) - 1) *
      Math.exp((1 - retrievability) * this.w[15]);

    return Math.max(Math.min(next, stability), FSRS_CONSTANTS.MIN_STABILITY);
  }

  initDifficulty(rating) {
    const d = this.w[4] - Math.exp(this.w[5] * (rating - 1)) + 1;
    return this.clampDifficulty(d);
  }

  nextDifficulty(difficulty, rating) {
    const delta = -(this.w[6] * (rating - 3));
    const next = difficulty + delta;
    const meanReverted = this.w[7] * this.initDifficulty(4) + (1 - this.w[7]) * next;
    return this.clampDifficulty(meanReverted);
  }

  clampDifficulty(difficulty) {
    return Math.min(Math.max(difficulty, FSRS_CONSTANTS.MIN_DIFFICULTY), FSRS_CONSTANTS.MAX_DIFFICULTY);
  }

  review(card, rating, now = new Date()) {
    const elapsedDays = card.lastReview ? (now.getTime() - new Date(card.lastReview).getTime()) / 86400000 : 0;
    const retrievability = card.stability > 0 ? this.retrievability(card.stability, elapsedDays) : 0;

    let state;
    let stability;
    let difficulty;
    let interval;

    if (card.state === State.NEW) {
      stability = this.initStability(rating);
      difficulty = this.initDifficulty(rating);

      if (rating === Rating.AGAIN) {
        state = State.LEARNING;
        interval = 1;
      } else if (rating === Rating.HARD) {
        state = State.LEARNING;
        interval = 5;
      } else if (rating === Rating.GOOD) {
        state = State.LEARNING;
        interval = 10;
      } else {
        state = State.REVIEW;
        interval = this.nextInterval(stability);
      }
    } else if (card.state === State.LEARNING || card.state === State.RELEARNING) {
      difficulty = this.nextDifficulty(card.difficulty, rating);

      if (rating === Rating.AGAIN) {
        state = card.state;
        stability = this.initStability(rating);
        interval = 1;
      } else if (rating === Rating.HARD) {
        state = card.state;
        stability = this.initStability(rating);
        interval = 5;
      } else {
        state = State.REVIEW;
        stability = this.initStability(rating);
        interval = this.nextInterval(stability);
      }
    } else {
      difficulty = this.nextDifficulty(card.difficulty, rating);

      if (rating === Rating.AGAIN) {
        state = State.RELEARNING;
        stability = this.nextStabilityFail(card.difficulty, card.stability, retrievability);
        interval = 1;
      } else {
        state = State.REVIEW;
        stability = this.nextStabilitySuccess(card.difficulty, card.stability, retrievability, rating);
        interval = this.nextInterval(stability);
      }
    }

    const due = this.calculateDue(now, interval, state);
    const lapses = rating === Rating.AGAIN && card.state === State.REVIEW ? (card.lapses || 0) + 1 : card.lapses || 0;
    const reps = state === State.REVIEW ? (card.reps || 0) + 1 : card.reps || 0;

    return {
      state,
      stability,
      difficulty,
      due: due.toISOString(),
      lastInterval: interval,
      lastReview: now.toISOString(),
      lastRating: rating,
      reps,
      lapses,
      _computed: { elapsedDays, retrievability, scheduledDays: interval }
    };
  }

  calculateDue(now, interval, state) {
    const due = new Date(now);
    if (state === State.LEARNING || state === State.RELEARNING) {
      due.setMinutes(due.getMinutes() + interval);
    } else {
      due.setDate(due.getDate() + interval);
      due.setHours(4, 0, 0, 0);
    }
    return due;
  }

  previewRatings(card) {
    const now = new Date();
    const previews = {};

    for (const rating of [1, 2, 3, 4]) {
      const result = this.review({ ...card }, rating, now);
      previews[rating] = {
        interval: result.lastInterval,
        state: result.state,
        isMinutes: result.state === State.LEARNING || result.state === State.RELEARNING
      };
    }

    return previews;
  }

  formatInterval(interval, isMinutes = false) {
    if (isMinutes) {
      if (interval < 60) return `${interval}m`;
      return `${Math.round(interval / 60)}h`;
    }

    if (interval === 1) return '1d';
    if (interval < 30) return `${interval}d`;
    if (interval < 365) return `${(interval / 30).toFixed(1)}mo`;
    return `${(interval / 365).toFixed(1)}y`;
  }

  simulateRetention(stability, days = 60) {
    return Array.from({ length: days + 1 }, (_, day) => ({
      day,
      retention: this.retrievability(stability, day)
    }));
  }
}

export const fsrs = new FSRS();
