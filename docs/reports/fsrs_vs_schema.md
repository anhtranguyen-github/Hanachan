# Cross-Check Report: FSRS Logic vs Final Schema

## 1. Objective
Ensure the mathematical parameters required by the FSRS algorithm documented in `FSRS_LOGIC.md` are persisted correctly in `final_schema.sql`.

## 2. Findings

### A. State Persistence
- **Alignment**: The `FSRS_LOGIC.md` document describes a state transition from `new` -> `learning` -> `review` -> `burned`. The `user_learning_states` table's `state` column uses exactly these CHECK constraint values.

### B. Mathematical Variables
- **Alignment**: 
    - `stability` (Double): Present in Schema.
    - `difficulty` (Double): Present in Schema.
    - `reps` (Integer): Present in Schema.
    - `lapses` (Integer): Present in Schema.
- **Consistency**: The documentation mentions a "Stability Threshold" for stage progression. These thresholds are implemented in the code layer, but the schema provides the necessary storage for the values.

### C. Queue Management
- **Alignment**: The documentation explains how the review queue is calculated using `next_review <= NOW()`. The schema includes the `next_review` timestamp with an index-compatible structure.

## 3. Discrepancies
- **Difficulty Baseline**: `FSRS_LOGIC.md` mentions a baseline difficulty of 3.0. The schema defaults difficulty to 0. This should be unified to prevent calculation errors on initialization.
