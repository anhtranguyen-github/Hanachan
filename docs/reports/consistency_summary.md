# Comprehensive Documentation Cross-Consistency Report

## 1. Summary
This report aggregates the findings from cross-checking the five core documentation sets of Hanachan v2: **Final Schema, ER Diagrams, FSRS Logic, Use Cases, and Class Design.**

## 2. Document Mapping Matrix

| Document | Primary Focus | Key Alignment |
| :--- | :--- | :--- |
| **Final Schema** | Physical Storage | Matches ER structure; provides FSRS variables. |
| **ER Diagrams** | Logical Relations | Bridges Content, Session, and Progress domains. |
| **FSRS Logic** | Algorithm Flow | Mapped precisely to the `user_learning_states` DB table. |
| **Use Cases** | User Requirements | Fully supported by Session Manager and Progress Tracker. |
| **Class Design** | Business Services | High-level orchestrators for all major Use Cases. |

## 3. Critical Synchronizations

### A. The "Review" Pipeline
- **UseCase**: "Answer review question" $\rightarrow$ **Class**: `ReviewSessionManager.submitAnswer()` $\rightarrow$ **ER**: `ReviewItem` update $\rightarrow$ **FSRS**: `calculateNextReview()` $\rightarrow$ **Schema**: Update `user_learning_states`.
- **Status**: **PASS**. The flow from user action to persistent state is logically consistent across all documents.

### B. The "Discovery" Pipeline
- **UseCase**: "Complete lesson batch" $\rightarrow$ **Class**: `LessonBatchManager.commitBatchToProgress()` $\rightarrow$ **ER**: `LessonBatch` status change $\rightarrow$ **Schema**: INSERT INTO `user_learning_states`.
- **Status**: **PASS**. Terminology like "Batch" and "LessonItem" is consistent.

### C. Assistant Integration
- **UseCase**: "View referenced content" $\rightarrow$ **Class**: `ChatAssistantService.extractReferences()` $\rightarrow$ **Schema**: `chat_messages.referenced_ku_ids`.
- **Status**: **PASS**. Explicit support for linking LLM output to Knowledge Units.

## 4. Minor Discrepancies Noted
1. **Difficulty Default**: Schema says `0.0`, FSRS Logic suggests `3.0`.
2. **Bridge Tables**: Physical schema uses arrays (e.g., `kanji_list`) while ER shows explicit bridge tables (`KanjiRadicals`). This is a implementation choice but should be documented as a "denormalization for performance."
3. **Guru/Master Labels**: The `user_learning_states` table uses generic enums, while UI-facing docs use WaniKani-style labels. The mapping in `FSRS_LOGIC.md` is critical to bridge this.
