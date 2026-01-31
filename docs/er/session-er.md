# Session Domain ER Diagram

This diagram describes the temporary and persistent states during learning and review sessions, as well as the long-term FSRS tracking logic.

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
  ku_id : UUID <<FK>>
  status : Enum (unseen, viewed, quiz_passed)
  created_at : Timestamp
}

' ==========================================
' REVIEW SESSIONS
' ==========================================
class ReviewSession <<Entity>> {
  + id : UUID <<PK>>
  --
  user_id : UUID <<FK>>
  status : Enum (active, finished)
  total_items : Integer
  completed_items : Integer
  started_at : Timestamp
  completed_at : Timestamp
}

class ReviewSessionItem <<Entity>> {
  + id : UUID <<PK>>
  --
  session_id : UUID <<FK>>
  ku_id : UUID <<FK>>
  facet : Enum (meaning, reading, cloze)
  status : Enum (pending, correct, incorrect)
  first_rating : Enum (again, good)
  attempts : Integer
  created_at : Timestamp
  updated_at : Timestamp
}

' ==========================================
' PROGRESS & LOGGING
' ==========================================
class UserLearningState <<Entity>> {
  + user_id : UUID <<PK, FK>>
  + ku_id : UUID <<PK, FK>>
  + facet : Enum (meaning, reading, cloze)
  --
  state : Enum (new, learning, review, burned)
  stability : Double
  difficulty : Double
  last_review : Timestamp
  next_review : Timestamp
  reps : Integer
  lapses : Integer
}

class UserLearningLog <<Entity>> {
  + id : UUID <<PK>>
  --
  user_id : UUID <<FK>>
  ku_id : UUID <<FK>>
  facet : Enum (meaning, reading, cloze)
  rating : Enum (again, good)
  stability : Double
  difficulty : Double
  interval : Integer
  created_at : Timestamp
}

' ==========================================
' CONNECTIONS
' ==========================================
User ||--o{ LessonBatch
User ||--o{ ReviewSession
User ||--o{ UserLearningState
User ||--o{ UserLearningLog

KnowledgeUnit ||--o{ UserLearningState

LessonBatch ||--o{ LessonItem
ReviewSession ||--o{ ReviewSessionItem

LessonItem }o--|| KnowledgeUnit
ReviewSessionItem }o--|| KnowledgeUnit

' Logical Data Flow
ReviewSessionItem ..> UserLearningState : "updates on 1st attempt"
UserLearningState ..> UserLearningLog : "creates entry"

@enduml
```

## Key Architectural Decisions

1. **Transactional Lesson Batches**: A `LessonBatch` represents a fixed discovery set. The status of individual items (`unseen`, `viewed`, `passed`) is tracked to allow users to pause and resume their learning progress perfectly.

2. **Atomic Review Sessions**: Review items are processed independently. Every correct answer triggers an **immediate** FSRS update. The `ReviewSession` and `ReviewSessionItem` tables are used for historical tracking and live progress calculation within the UI session.

3. **Facet Independence**: SRS is calculated per-facet (Meaning, Reading, Cloze). This ensures that forgetting a word's reading doesn't unnecessarily reset the progress of knowing its meaning.

4. **Analytical Integrity**: Every interaction that affects an SRS state is recorded in `UserLearningLog`. This provides a complete audit trail of the user's learning history, used for calculating high-level metrics like accuracy and retention rates.

5. **No Reveal UX Rule**: In both reviews and lesson quizzes, an incorrect answer does not reveal the solution. Instead, the item is re-queued for another attempt later in the session, while the FSRS state is updated immediately based on the initial failure.
