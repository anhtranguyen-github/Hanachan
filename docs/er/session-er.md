# Session Domain ER Diagram

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
class Question <<Stub>> {
  + id : UUID
}

' ==========================================
' LEARNING SESSIONS
' ==========================================
class LessonBatch <<Entity>> {
  + id : UUID
  --
  user_id : UUID <<FK>>
  status : Enum (IN_PROGRESS, COMPLETED, ABANDONED)
  started_at : Timestamp
  completed_at : Timestamp
}

class LessonItem <<Entity>> {
  + id : UUID
  --
  batch_id : UUID <<FK>>
  ku_id : UUID <<FK>>
  question_id : UUID <<FK>>
  user_answer : Array<String>
  answer_state : Enum (UNANSWERED, CORRECT, INCORRECT)
  is_corrected : Boolean -- Must be True for all items to close batch
}

' ==========================================
' REVIEW SESSIONS
' ==========================================
class ReviewSession <<Entity>> {
  + id : UUID
  --
  user_id : UUID <<FK>>
  status : Enum (ACTIVE, FINISHED)
  started_at : Timestamp
}

class ReviewItem <<Entity>> {
  + id : UUID
  --
  session_id : UUID <<FK>>
  ku_id : UUID <<FK>>
  question_id : UUID <<FK>>
  user_answer : Array<String>
  answer_state : Enum (UNANSWERED, CORRECT, INCORRECT)
  rating : Enum (PASS, FAIL) -- Final rating for FSRS
  is_passed : Boolean -- Becomes True when specific question is cleared
}

' Note: A KnowledgeUnit is only cleared from Review Session 
' when ALL its linked ReviewItems in that session have is_passed = True.

' ==========================================
' LONG-TERM PROGRESS (FSRS STATE)
' ==========================================
class UserLearningState <<Entity>> {
  + user_id : UUID <<PK, FK>>
  + ku_id : UUID <<PK, FK>>
  --
  state : Enum (NEW, LEARNING, REVIEW, BURNED)
  stability : Double
  difficulty : Double
  last_review : Timestamp
  next_review : Timestamp
  reps : Integer
  lapses : Integer
}

' ==========================================
' CONNECTIONS
' ==========================================
User ||--o{ LessonBatch
User ||--o{ ReviewSession
User ||--o{ UserLearningState

LessonBatch ||--o{ LessonItem
ReviewSession ||--o{ ReviewItem

LessonItem }o--|| KnowledgeUnit
ReviewItem }o--|| KnowledgeUnit

' Data Flow
LessonItem ..> UserLearningState : "initializes"
ReviewItem ..> UserLearningState : "updates stability"

@enduml
```

## Key Architectural Decisions

1. **Lesson Batch Logic**: A `LessonBatch` represents a fixed "Discovery" set. The session cannot be `COMPLETED` until every `LessonItem` has `is_corrected = True`. This ensures the user has at least identified the correct answer for every new item once.
2. **Review Session Logic (Item Clearing)**: A Review Session is more dynamic. A single `KnowledgeUnit` (e.g., a Vocabulary word) might generate two `ReviewItem` entries (one for Reading, one for Meaning). 
   - Once `is_passed = True` for both, the word is removed from the active review queue and the `rating` is sent to the FSRS engine.
3. **Session Interruption**: If a user leaves an active session, the progress is saved. When they return, only items where `is_corrected` or `is_passed` is `False` will be shown.
