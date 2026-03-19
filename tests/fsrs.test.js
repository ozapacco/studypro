import { describe, it, expect } from 'vitest';
import { FSRS } from '../src/lib/fsrs/fsrs.js';
import { State, Rating } from '../src/lib/fsrs/states.js';

describe('FSRS Engine', () => {
  const fsrs = new FSRS({ enableFuzz: false });

  describe('retrievability', () => {
    it('is 1.0 on day zero', () => {
      expect(fsrs.retrievability(10, 0)).toBeCloseTo(1, 3);
    });

    it('decays with time', () => {
      const r5 = fsrs.retrievability(10, 5);
      const r10 = fsrs.retrievability(10, 10);
      expect(r5).toBeGreaterThan(r10);
    });

    it('higher stability decays slower', () => {
      const low = fsrs.retrievability(5, 10);
      const high = fsrs.retrievability(20, 10);
      expect(high).toBeGreaterThan(low);
    });
  });

  describe('new card', () => {
    const newCard = {
      state: State.NEW,
      stability: 0,
      difficulty: 5,
      reps: 0,
      lapses: 0,
      lastReview: null
    };

    it('good moves to learning', () => {
      const result = fsrs.review(newCard, Rating.GOOD);
      expect(result.state).toBe(State.LEARNING);
      expect(result.stability).toBeGreaterThan(0);
    });

    it('easy moves directly to review', () => {
      const result = fsrs.review(newCard, Rating.EASY);
      expect(result.state).toBe(State.REVIEW);
      expect(result.lastInterval).toBeGreaterThan(1);
    });

    it('again has lower initial stability than good', () => {
      const again = fsrs.review(newCard, Rating.AGAIN);
      const good = fsrs.review(newCard, Rating.GOOD);
      expect(again.stability).toBeLessThan(good.stability);
    });
  });

  describe('review card', () => {
    const reviewCard = {
      state: State.REVIEW,
      stability: 10,
      difficulty: 5,
      reps: 5,
      lapses: 0,
      lastReview: new Date(Date.now() - 10 * 86400000).toISOString()
    };

    it('again sends to relearning and increments lapses', () => {
      const result = fsrs.review(reviewCard, Rating.AGAIN);
      expect(result.state).toBe(State.RELEARNING);
      expect(result.lapses).toBe(1);
    });

    it('good increases stability', () => {
      const result = fsrs.review(reviewCard, Rating.GOOD);
      expect(result.stability).toBeGreaterThan(reviewCard.stability);
    });

    it('easy increases stability more than good', () => {
      const good = fsrs.review(reviewCard, Rating.GOOD);
      const easy = fsrs.review(reviewCard, Rating.EASY);
      expect(easy.stability).toBeGreaterThan(good.stability);
    });
  });

  describe('preview ratings', () => {
    it('returns all four ratings', () => {
      const previews = fsrs.previewRatings({
        state: State.REVIEW,
        stability: 10,
        difficulty: 5,
        reps: 5,
        lapses: 0,
        lastReview: new Date().toISOString()
      });

      expect(Object.keys(previews)).toHaveLength(4);
      expect(previews[1].interval).toBeLessThan(previews[4].interval);
    });
  });
});
