import { describe, it, expect } from 'vitest';
import { Scheduler } from '../src/lib/engines/scheduler.js';

describe('Scheduler sortByPriority', () => {
  const scheduler = new Scheduler();

  it('prioritizes learning states over review', () => {
    const sorted = scheduler.sortByPriority([
      { id: 1, state: 'review', due: new Date(Date.now() - 3600e3).toISOString(), difficulty: 3 },
      { id: 2, state: 'learning', due: new Date(Date.now() - 3600e3).toISOString(), difficulty: 2 }
    ]);

    expect(sorted[0].id).toBe(2);
  });

  it('prioritizes more overdue cards', () => {
    const sorted = scheduler.sortByPriority([
      { id: 1, state: 'review', due: new Date(Date.now() - 2 * 86400e3).toISOString(), difficulty: 2 },
      { id: 2, state: 'review', due: new Date(Date.now() - 5 * 86400e3).toISOString(), difficulty: 2 }
    ]);

    expect(sorted[0].id).toBe(2);
  });

  it('uses difficulty as tie breaker', () => {
    const due = new Date(Date.now() - 3600e3).toISOString();
    const sorted = scheduler.sortByPriority([
      { id: 1, state: 'review', due, difficulty: 2 },
      { id: 2, state: 'review', due, difficulty: 8 }
    ]);

    expect(sorted[0].id).toBe(2);
  });
});
