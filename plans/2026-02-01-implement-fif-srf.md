# Implementation Plan: FSRS Failure Intensity Framework (FIF)

## 1. Objective
Upgrade the Review Logic from "First Attempt Rule" to "Failure Intensity Framework (FIF)" to resolve the "Multiple Wrongs" problem without creating "Ease Hell".

## 2. Requirements (from ARCHITECTURE_PROPOSAL_FIF.md)
*   **Tracking**: Track `wrong_count` for each item in the current session.
*   **Persistence**: `wrong_count` must be saved to DB immediately on failure.
*   **Logic**:
    *   `Failure Intensity = log2(wrong_count + 1)` (Diminishing Return).
    *   `Decay = exp(-beta * failure_intensity)`.
    *   FSRS Update happens **ONCE** upon success.

## 3. Architecture Changes

### A. Database (Schema)
*   Table `review_session_items`: Add `wrong_count` (integer, default 0).
*   *Note: Since we are using Supabase, we might need to simulate this if we can't run migrations easily, but we will assume we can update the Types.*

### B. FSRSEngine (`src/features/learning/domain/FSRSEngine.ts`)
*   Update `calculateNextReview` to accept an optional `failureIntensity` parameter.
*   Implement the Capping and Decay logic.

### C. SRS Repository (`src/features/learning/srsRepository.ts`)
*   Add `incrementWrongCount(sessionId, unitId, facet)` method.
*   Update `updateReviewSessionItem` to respect the new tracking.

### D. Review Controller (`src/features/learning/ReviewSessionController.ts`)
*   Heavy Refactor of `submitAnswer`:
    *   **If Incorrect**:
        *   Call `srsRepository.incrementWrongCount`.
        *   Requeue item locally.
        *   Do NOT call `submitReview` (FSRS).
    *   **If Correct**:
        *   Retrieve `wrong_count` (from local state or DB).
        *   Calculate `failureIntensity`.
        *   Call `submitReview` (FSRS) with the intensity.
        *   Remove from queue.

## 4. Execution Steps
1.  **Refactor FSRSEngine**: Add the Math logic.
2.  **Update SRS Repository**: Add DB operations.
3.  **Refactor ReviewSessionController**: Implement the FIF flow.
4.  **Verify**: Check logic against the proposal.
