# Audit Resolution Guide & Progress Log

**Project:** Sistemão / Atlas Experience
**Start Date:** 2026-03-18
**Status:** In Progress

## Context

A system-wide audit identified four critical bottlenecks related to "Offline-first" architecture using Dexie.js (IndexedDB). This document tracks the analysis and resolution of these issues to ensure scalability for 15,000+ cards.

---

## 📅 Log of Analysis and Updates

### 2026-03-18: Scheduler Optimization

- **Status:** [x] Completed
- **Changes:**
  - Refactored [getQueueStats](file:///c:/Dev/Sistem%C3%A3o/src/lib/engines/scheduler.js#85-118) to use `.count()` on indexed collections.
  - Optimized [getDueCards](file:///c:/Dev/Sistem%C3%A3o/src/lib/engines/scheduler.js#5-24), [getNewCards](file:///c:/Dev/Sistem%C3%A3o/src/lib/engines/scheduler.js#25-55), and [getLearningCards](file:///c:/Dev/Sistem%C3%A3o/src/lib/engines/scheduler.js#56-64) to use collections and `.toArray()` only when necessary.
  - Added indices for `buried` and `suspended` to [db.js](file:///c:/Dev/Sistem%C3%A3o/src/lib/db.js) (Version 2).

---

## 🛠 Updates Checklist

### 2026-03-18: Priority Ranking and Stats Optimization

- **Status:** [x] Completed
- **Changes:**
  - Implemented efficient [updateSubjectStats](file:///c:/Dev/Sistem%C3%A3o/src/lib/stores/cards.js#138-171) in [cards.js](file:///c:/Dev/Sistem%C3%A3o/src/lib/stores/cards.js) using indexed counts and `.each()` for difficulty.
  - Added incremental stats update logic ([recordCardReview](file:///c:/Dev/Sistem%C3%A3o/src/lib/stores/cards.js#172-199)) to avoid expensive recalcs.
  - Integrated real-time stats updates in `sessionStore.answer`.
  - Refactor [PriorityRanker](file:///c:/Dev/Sistem%C3%A3o/src/lib/engines/priorityRanker.js#3-104) to use these $O(1)$ denormalized stats.

---

### 2026-03-18: Async Backup Import (Web Worker)

- **Status:** [x] Completed
- **Changes:**
  - Created [importWorker.js](file:///c:/Dev/Sistem%C3%A3o/src/lib/importers/importWorker.js) with all heavy processing logic.
  - Refactored [studeiBackup.js](file:///c:/Dev/Sistem%C3%A3o/src/lib/importers/studeiBackup.js) to delegate to worker via `postMessage`.
  - Moved all parsing/normalization logic to worker for non-blocking import.

---

## 🛠 Updates Checklist

### 🔴 1. Memory Collapse in Scheduler

- [x] Refactor [getQueueStats()](file:///c:/Dev/Sistem%C3%A3o/src/lib/engines/scheduler.js#85-118) to use indexed `.count()`
- [x] Optimize [getDueCards()](file:///c:/Dev/Sistem%C3%A3o/src/lib/engines/scheduler.js#5-24) for large datasets

### 🔴 2. Log Cleanup Indexing/Blocking

- [x] Implement chunked deletion in [cleanupOldData](file:///c:/Dev/Sistem%C3%A3o/src/lib/db.js#138-160)
- [x] Verify `reviewLogs` timestamp index usage

### 🔴 3. PriorityRanker Bottleneck

- [x] Implement denormalized `stats` in `subjects` table
- [x] Update `sessionStore.answer` to incrementally update stats
- [x] Refactor [PriorityRanker](file:///c:/Dev/Sistem%C3%A3o/src/lib/engines/priorityRanker.js#3-104) to use denormalized stats ($O(1)$ lookup)

### 🟡 4. Synchronous Backup Import

- [x] Create `importWorker.js` for heavy processing
- [x] Update [studeiBackup.js](file:///c:/Dev/Sistem%C3%A3o/src/lib/importers/studeiBackup.js) to use the worker

---

## Technical Directives for Future Agents

1. **Never use `.toArray()` on the `cards` or `reviewLogs` tables** unless the result set is explicitly limited (e.g., via `.limit(n)`).
2. **Prefer Aggregate Stats**: Use the `stats` field in the `subjects` table for any ROI or ranking calculations.
3. **Async Heavy Tasks**: Any task taking >50ms or involving complex regex/normalization MUST be offloaded to a Web Worker.
