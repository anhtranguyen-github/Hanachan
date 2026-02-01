# Implementation Plan: Learn and Review Codebase Synchronization

## Objective
Align the codebase for the "Learn" and "Review" features with the detailed documentation (`docs/detailed-uc/detailed-uc.md`, `docs/uncertain/class/classes.md`). Focus on FSRS consistency, level unlocking logic, and session persistence.

## 1. Core Logic (FSRS & Unlocking)
- [ ] **Automate Level Unlocking**: Trigger `checkAndUnlockNextLevel` in `LearningService.submitReview` when an item reaches the `review` stage.
- [ ] **Refine Achievement Stats**: Ensure dashboard stats clearly distinguish between "In Progress" (Learning stage) and "Mastered" (Review/Burned stage).

## 2. Review Session Controller
- [ ] **Ensure Status Persistence**: Verify that `ReviewSessionController` correctly updates `review_sessions` and `review_session_items` in all states (correct, incorrect, completion).
- [ ] **Zero-Reveal Enforcement**: Confirm `ReviewCardDisplay` strictly hides answers for incorrect attempts as per the "Zero-Reveal Rule". (Already verified, will double-check during testing).

## 3. Learning Batch Flow
- [ ] **Strict Batch Completion**: Ensure the `LearnSessionPage` correctly transitions to the results phase only when all items are successfully passed in the quiz.
- [ ] **Sync Batch & Session**: Ensure `lesson_batches` and `review_sessions` stay in sync during a learning session.

## 4. UI/UX Polishing
- [ ] **Mistakes Tracking**: Improve the accuracy of the mistakes counter in the session results page.
- [ ] **Next Review Forecast**: Implement a real (though simplified) forecast based on actual `next_review` dates in the database.

## 5. Verification
- [ ] **Manual Test**: Run a full learning batch (5 items) and verify level unlocking.
- [ ] **Manual Test**: Run a review session and verify FSRS interval updates in the database.
