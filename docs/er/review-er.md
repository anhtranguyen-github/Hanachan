# Review Session Domain ER Diagram

This diagram describes the tracking logic for **Spaced Repetition Reviews**, including session history and FSRS state updates.

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
  unit_id : UUID <<FK>>
  facet : Enum (meaning, reading, cloze)
  status : Enum (pending, correct, incorrect)
  first_rating : Enum (again, good)
  attempts : Integer
  wrong_count : Integer
  created_at : Timestamp
  updated_at : Timestamp
}

' ==========================================
' PROGRESS & LOGGING
' ==========================================
class UserLearningState <<Entity>> {
  + user_id : UUID <<PK, FK>>
  + unit_id : UUID <<PK, FK>>
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
  unit_id : UUID <<FK>>
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
User ||--o{ ReviewSession
User ||--o{ UserLearningState
User ||--o{ UserLearningLog

KnowledgeUnit ||--o{ UserLearningState

ReviewSession ||--o{ ReviewSessionItem
ReviewSessionItem }o--|| KnowledgeUnit

' Logical Data Flow
ReviewSessionItem ..> UserLearningState : "updates on success with wrong_count penalty"
UserLearningState ..> UserLearningLog : "creates entry"

@enduml
```

## Key Architectural Decisions

1. **FIF Architecture (Failure Intensity Framework)**: Review items are processed in a "Drill then Commit" flow. Incorrect answers increment `wrong_count` without updating FSRS. A correct answer triggers a **single** FSRS update, applying a logarithmic penalty based on `wrong_count`. This prevents "Ease Hell" while accurately reflecting recall effort.

2. **No Gen Quiz Policy**: The system does not generate questions on the fly. This ensures that every question shown to the user (whether for meaning, reading, or grammar) has been explicitly defined or curated in the `Question` table.

3. **Facet Independence**: SRS is calculated per-facet (Meaning, Reading, Cloze), where each facet maps to a specific `Question` type linked to a `KnowledgeUnit`.
