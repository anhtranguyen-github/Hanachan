# Master System ER Diagram - Hanachan v2

This diagram provides a birds-eye view of the entire system, consolidating the User, Content, Session, and Assistant domains.

```plantuml
@startuml
skinparam packageStyle rectangle
skinparam classAttributeIconSize 0
hide circle

' ==========================================
' 1. USER DOMAIN
' ==========================================
class User <<Entity>> {
  + id : UUID <<PK>>
  --
  display_name : String
  level : Integer (1-60)
  last_activity_at : Timestamp
  created_at : Timestamp
}

' ==========================================
' 2. CONTENT DOMAIN
' ==========================================
class KnowledgeUnit <<Entity>> {
  + id : UUID <<PK>>
  --
  slug : String <<Unique>>
  type : Enum (RADICAL, KANJI, VOCABULARY, GRAMMAR)
  level : Integer (1-60)
  jlpt : Integer (1-5)
  character : String
  meaning : String
}

class RadicalDetail <<Entity>> {
  + ku_id : UUID <<PK, FK>>
  --
  meaning_mnemonic : Text
  image_url : String
}

class KanjiDetail <<Entity>> {
  + ku_id : UUID <<PK, FK>>
  --
  onyomi : Array<String>
  kunyomi : Array<String>
  meaning_mnemonic : Text
  reading_mnemonic : Text
  stroke_order_svg : Text
}

class VocabularyDetail <<Entity>> {
  + ku_id : UUID <<PK, FK>>
  --
  reading : String
  audio_url : String
  parts_of_speech : Array<String>
  pitch_accent : JSONB
}

class GrammarDetail <<Entity>> {
  + ku_id : UUID <<PK, FK>>
  --
  structure : String
  explanation : Text
  nuance : Text
  cautions : Text
  example_sentences : JSONB -- List<{ja, en, audio}>
}

' Bridge Tables (Cross-References)
class KanjiRadical <<Entity>> {
  + kanji_id : UUID <<PK, FK>>
  + radical_id : UUID <<PK, FK>>
}

class VocabularyKanji <<Entity>> {
  + vocab_id : UUID <<PK, FK>>
  + kanji_id : UUID <<PK, FK>>
}

class GrammarRelation <<Entity>> {
  + grammar_id : UUID <<PK, FK>>
  + related_id : UUID <<PK, FK>>
  + type : Enum
}

' ==========================================
' 3. QUESTION DOMAIN
' ==========================================
class Question <<Entity>> {
  + id : UUID <<PK>>
  --
  ku_id : UUID <<FK>>
  facet : String (meaning, reading, cloze)
  type : Enum (fill_in, cloze)
  prompt : String
  correct_answers : Array<String>
}

' ==========================================
' 4. PROGRESS & LOGGING
' ==========================================
class UserLearningState <<Entity>> {
  + user_id : UUID <<PK, FK>>
  + ku_id : UUID <<PK, FK>>
  + facet : String <<PK>>
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
  facet : String
  rating : Enum (again, good)
  stability : Double
  difficulty : Double
  interval : Integer
  created_at : Timestamp
}

' ==========================================
' 5. SESSION DOMAIN
' ==========================================
class LessonBatch <<Entity>> {
  + id : UUID <<PK>>
  --
  user_id : UUID <<FK>>
  level : Integer
  status : Enum (in_progress, completed, abandoned)
}

class LessonItem <<Entity>> {
  + id : UUID <<PK>>
  --
  batch_id : UUID <<FK>>
  ku_id : UUID <<FK>>
  status : Enum (unseen, viewed, quiz_passed)
}

class ReviewSession <<Entity>> {
  + id : UUID <<PK>>
  --
  user_id : UUID <<FK>>
  status : Enum (active, finished)
}

class ReviewSessionItem <<Entity>> {
  + id : UUID <<PK>>
  --
  session_id : UUID <<FK>>
  ku_id : UUID <<FK>>
  facet : String
  first_rating : Enum
}

' ==========================================
' 6. ASSISTANT DOMAIN
' ==========================================
class ChatSession <<Entity>> {
  + id : UUID <<PK>>
  --
  user_id : UUID <<FK>>
  title : String
}

class ChatMessage <<Entity>> {
  + id : UUID <<PK>>
  --
  session_id : UUID <<FK>>
  role : Enum (system, user, assistant)
  content : Text
  referenced_ku_ids : Array<UUID>
}

' ==========================================
' CONNECTIONS
' ==========================================

' Content Hierarchies
KnowledgeUnit ||--o| RadicalDetail
KnowledgeUnit ||--o| KanjiDetail
KnowledgeUnit ||--o| VocabularyDetail
KnowledgeUnit ||--o| GrammarDetail
KnowledgeUnit ||--o{ Question

' Relationship Bridges
KanjiRadical }o--|| KnowledgeUnit
KanjiRadical }o--|| KnowledgeUnit
VocabularyKanji }o--|| KnowledgeUnit
VocabularyKanji }o--|| KnowledgeUnit
GrammarRelation }o--|| KnowledgeUnit

' Progress tracking
User ||--o{ UserLearningState
User ||--o{ UserLearningLog
KnowledgeUnit ||--o{ UserLearningState

' Sessions
User ||--o{ LessonBatch
User ||--o{ ReviewSession
LessonBatch ||--o{ LessonItem
ReviewSession ||--o{ ReviewSessionItem
LessonItem }o--|| KnowledgeUnit
ReviewSessionItem }o--|| KnowledgeUnit

' Assistant
User ||--o{ ChatSession
ChatSession ||--o{ ChatMessage
ChatMessage }o..|| KnowledgeUnit : "references"

@enduml
```

## Key Architectural Decisions

1. **Normalized Content Details**: To support diverse Knowledge Unit (KU) types while maintaining a unified interface, core metadata is stored in `KnowledgeUnit`, while type-specific data resides in extension tables (`KanjiDetail`, etc.). This ensures efficient filtering and browsing across all content types.

2. **Transactional Lessons vs. Atomic Reviews**:
   - **Lessons**: Structured as batches that require full completion. Progress is saved per-item for resumability.
   - **Reviews**: Items are independent. FSRS updates happen immediately on the first attempt, making the review process "Atomic". The `ReviewSession` tables serve primarily for historical logging and session-end analytics.

3. **FSRS Independence Law**: Progression is tracked per **facet** (e.g., you might know a word's meaning but not its reading). Each facet has its own record in `UserLearningState`, allowing for granular recall optimization.

4. **Circular Knowledge Graph**: The system implements explicit cross-referencing (e.g., `VocabularyKanji`, `KanjiRadical`). This allows the UI and the AI Chatbot to traverse the knowledge graph, providing context like "What radicals make up this Kanji?" or "What vocabulary uses this character?".

5. **Analytical Logging**: Every review event is logged in `UserLearningLog`. This provides the raw data necessary for generating heatmaps, retention curves, and precision statistics on the user's dashboard.
