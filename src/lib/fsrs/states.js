export const State = Object.freeze({
  NEW: 'new',
  LEARNING: 'learning',
  REVIEW: 'review',
  RELEARNING: 'relearning'
});

export const Rating = Object.freeze({
  AGAIN: 1,
  HARD: 2,
  GOOD: 3,
  EASY: 4
});

export const RatingLabels = {
  1: { text: 'Again', color: 'red', shortcut: '1' },
  2: { text: 'Hard', color: 'orange', shortcut: '2' },
  3: { text: 'Good', color: 'green', shortcut: '3' },
  4: { text: 'Easy', color: 'blue', shortcut: '4' }
};
