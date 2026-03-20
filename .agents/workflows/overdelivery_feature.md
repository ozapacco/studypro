---
description: How to implement a new feature with Overdelivery (StudyPro Expert)
---

# 🚀 OVERDELIVERY WORKFLOW: Feature Implementation

This workflow ensures every change is documented, tested, and deployed according to the user's global rules.

## 1. PRE-PHASE: Analysis & Context
1. Read `PLAN0__IMPLEMENTACAO_COMPLETO.md` to see where the current task fits.
2. Visit `https://studypro-six.vercel.app/` to check the current live production state.
3. Create a comprehensive implementation plan in `TASK_X_IMPLEMENTATION_PLAN.md` (where X is the next sequence number).

## 2. PHASE 1: Designing for Memory
1. Evaluate if the feature supports **Active Recall** or **Spaced Repetition**.
2. Design UI with **Rich Aesthetics**: Vibrant colors, dark modes, glassmorphism, and smooth transitions (Svelte 5).
3. If new data is needed, update `src/lib/db.js` (Dexie stores).

// turbo
## 3. PHASE 2: Implementation & Tests
1. Implement the core logic in `src/lib/engines/` or `src/lib/stores/`.
2. Create Vitest unit tests in `tests/` for the new logic.
3. Implement the UI components in `src/lib/components/`.

## 4. PHASE 3: Verification & Polish
1. Run `npm run test` and `npm run check`.
2. Verify visual excellence and performance (Bundle size/loading times).

// turbo
## 5. PHASE 4: Deployment & Documentation
1. Create a `WALKTHROUGH.md` artifact summarizing the change and its pedagogical value.
2. Commit and Push to `origin master`.
3. Verify the deploy at `https://studypro-six.vercel.app/`.
4. Notify the user with a summary of the "overdelivery" (the extra value added).

---
*Follow this every time to remain the 'Supreme Expert' of StudyPro.*
