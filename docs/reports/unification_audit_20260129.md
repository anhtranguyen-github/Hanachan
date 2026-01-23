# Documentation & Codebase Unification Audit (2026-01-29)

This report summarizes the status of the unification between the Hanachan v2 documentation and the current production codebase after the recent "Immersion-First" and "Entity Linking" updates.

## 1. Summary of Unified Modules

| Module | Status | Unification Details |
| :--- | :--- | :--- |
| **Logic SRS** | ✅ Unified | Standardized on binary `pass`/`fail`. Removed legacy `again/hard/good/easy`. |
| **Entity Mapping** | ✅ Unified | Lowercase normalization (`radical`, `kanji`, `vocabulary`, `grammar`) applied to all layers. |
| **Quiz Logic** | ✅ Unified | Enforced `fill_in` and `cloze`. Removed `multiple_choice`. |
| **Chatbot** | ✅ Unified | `SimpleAgent` now supports `PROGRESS` intent and automated CTA entity linking. |
| **Review Flow** | ✅ Unified | Implemented "Buffered Persistence" (Single SRS update per session context). |

## 2. Component Synchronization (Pair Report)

### A. Spaced Repetition (SRS)
*   **Doc (`docs/fsrs/FSRS_LOGIC.md`)**: Updated to reflect $1.5x$ stability growth for `pass` and $0.5x$ for `fail`.
*   **Code (`src/features/learning/domain/FSRSEngine.ts`)**: Binary logic implemented. `fromResult` middle-man removed.

### B. Business Process
*   **Doc (`docs/businessflow/bussinessflow.md`)**: Formalized the "Vocabulary Session Rule" where both Meaning and Reading must be correct to exit the session.
*   **Code (`src/features/learning/ReviewSessionController.ts`)**: Implemented local `Set<string>` to track session successes/failures before committing to DB.

### C. Entity Definition
*   **Doc (`docs/er/full-system-er.md`)**: Normalized and corrected to lowercase enums to match production constraints.
*   **Code (`src/lib/validation.ts`)**: Updated Zod schemas to include missing enums (`BatchStatus`, `QuestionType`, etc.) for full-stack consistency.

### D. AI Assistant
*   **Doc (`docs/detailed-uc/detailed-uc.md`)**: Use Case 4 (Chat) updated to include "Asking about Progress" as a core capability.
*   **Code (`src/features/chat/simple-agent.ts`)**: Integrated `fetchUserDashboardStats` and automated `referencedKUs` mapping.

## 3. Residual Gaps (Low Priority)
1.  **Analytics Persistence**: The `daily_stats` table in Doc 3.1.A is currently simulated via `user_learning_states` queries. A future DB migration should add the dedicated table for performance.
2.  **IME Interaction**: `docs/fsrs/FSRS_LOGIC.md` mentions "IME-style Input" for readings. The current UI uses standard text inputs; visual IME support is a frontend enhancement.

## 4. Conclusion
The system is now **fully synchronized**. The "Odd" feeling of mixed terminology between Anki-style subjectiveness and Immersion-style objectiveness has been resolved by adopting a strict binary result model.
