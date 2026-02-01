# Discovery (Learning) Session Domain ER Diagram

This diagram describes the persistent states during the **Discovery Phase** (learning new material for the first time).

```plantuml
@startuml
skinparam packageStyle rectangle
skinparam classAttributeIconSize 0
hide circle

' ==========================================
' STUBS FROM OTHER DOMAINS
' ==========================================
class User <<Stub>> {
  + id : UUID
}
class KnowledgeUnit <<Stub>> {
  + id : UUID
}

' ==========================================
' LEARNING SESSIONS (Discovery)
' ==========================================
class LessonBatch <<Entity>> {
  + id : UUID <<PK>>
  --
  user_id : UUID <<FK>>
  level : Integer
  status : Enum (in_progress, completed, abandoned)
  started_at : Timestamp
  completed_at : Timestamp
}

class LessonItem <<Entity>> {
  + id : UUID <<PK>>
  --
  batch_id : UUID <<FK>>
  unit_id : UUID <<FK>>
  status : Enum (unseen, viewed, quiz_passed)
  created_at : Timestamp
}

' ==========================================
' CONNECTIONS
' ==========================================
User ||--o{ LessonBatch
LessonBatch ||--o{ LessonItem
LessonItem }o--|| KnowledgeUnit

@enduml
```

## Key Architectural Decisions

1. **Transactional Lesson Batches**: A `LessonBatch` represents a fixed discovery set (e.g., 5 items). The system tracks the complete lifecycle of this batch.

2. **Granular Resume Capability**: The status of individual items (`unseen`, `viewed`, `quiz_passed`) is tracked in `LessonItem`. This allows users to drop off at any point (e.g., in the middle of a slideshow) and resume exactly where they left off without losing progress.

3. **Strict DB-Driven Onboarding**: Note that this diagram **does not** touch the `UserLearningState` tables directly. The connection to the long-term memory system (SRS) happens only *after* a `LessonItem` reaches the `quiz_passed` status. All questions used for the quiz are loaded from the `Question` table (No Gen Quiz policy).
