# Cross-Check Report: Use Cases vs ER & Schema

## 1. Objective
Verify that all user actions listed in `usecase.md` are supported by the data models (`ER`) and physical storage (`Schema`).

## 2. Findings

### A. "Learn Lessons" Flow
- **UC Actions**: View batch, Start batch, Answer question, Complete batch.
- **Support**: `lesson_batches` and `lesson_items` tables provide the session persistence needed to allow a user to "Quit" and "Resume" a batch later.

### B. "Review Knowledge" Flow
- **UC Actions**: Start review session, Answer review, Complete session.
- **Support**: Supported by `review_sessions` and `review_items`. 
- **FSRS Integration**: The logic in `ReviewItem` (Session Domain) successfully captures the `rating` (AGAIN, HARD, GOOD, EASY) required to update the `UserLearningState` (Progress Domain).

### C. "Browse Content" Flow
- **UC Actions**: Filter by level, search, view radicals.
- **Support**: `knowledge_units` table has `level` and JSON/Detail links to support rich browsing.
- **Note**: "Listen to vocabulary audio" is supported by `ku_details_vocabulary.audio_url`.

### D. "Chat with Assistant" Flow
- **UC Actions**: Start session, ask questions, view referenced content.
- **Support**: `chat_messages` table contains `referenced_ku_ids`, matching the "View referenced content" use case requirement.

## 3. Gaps
- **Filter by learning status**: While the schema has `user_learning_states`, the Browse view requires a JOIN between `knowledge_units` and `user_learning_states`. This is structurally possible but performance-intensive if not indexed properly.
