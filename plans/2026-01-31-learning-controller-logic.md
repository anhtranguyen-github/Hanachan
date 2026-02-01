# Plan: Learning Controller Logic & SRS Initialization

## Objective
Update the learning system to distinguish between **Atomic Review** (SRS) and **Batch-based Mastery** (Discovery/Learning). Ensure SRS states are only initialized for new items after they pass the Mastery Quiz.

## Domain & Invariants
1.  **Review Mode**:
    *   Update FSRS state immediately upon first attempt of a facet.
    *   If correct, remove from queue.
    *   If incorrect, re-queue at the end.
2.  **Learn Mode**:
    *   Do NOT update FSRS state during the Quiz phase of a Batch.
    *   Use the "Mistake" count for analytics.
    *   Initialize SRS state only when the Batch/Item is marked as `quiz_passed`.
    *   Initial SRS State: `state: 'learning'`, `stability: 0.166` (4 hours), `difficulty: 3.0`, `reps: 1`.

## Implementation Steps

### 1. Update `ReviewSessionController.ts`
*   Add `mode: 'learn' | 'review'` to constructor and state.
*   Modify `submitAnswer`:
    *   If `mode === 'review'`, keep current atomic update logic.
    *   If `mode === 'learn'`, skip `submitReview` but still track session item status (correct/incorrect) in `review_session_items`.
*   Ensure `getNextItem` and queue management remain robust for both modes.

### 2. Update `LearningService.ts`
*   Add `initializeSRS(userId, kuId, facet, rating)`:
    *   Logic: Sets initial stability/difficulty and schedules next review in 4 hours.
*   Update `checkAndUnlockNextLevel`: Ensure it handles the new persistence logic if needed.

### 3. Update `app/(main)/learn/session/page.tsx`
*   Pass `mode: 'learn'` to `ReviewSessionController`.
*   When `quiz_passed`, call a new action or service method to initialize SRS for that KU.

### 4. Database / Persistence
*   Ensure `learningRepository.updateUserState` is flexible enough for both updates and initializations.

## Error Handling
*   Wrap database calls in try/catch.
*   If `mode === 'learn'` and SRS initialization fails, retry or log heavily.

## Verification
*   Manual test via browser subagent (mocking a learn session).
*   Run E2E tests for chatbot and review to ensure no regressions.
