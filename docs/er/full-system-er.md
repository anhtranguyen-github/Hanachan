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
  type : Enum (radical, kanji, vocabulary, grammar)
  level : Integer (1-60)
  jlpt : Integer (1-5)
  character : String
  meaning : String
}

class RadicalDetail <<Entity>> {
  + unit_id : UUID <<PK, FK>>
  --
  meaning_mnemonic : Text
  image_url : String
}

class KanjiDetail <<Entity>> {
  + unit_id : UUID <<PK, FK>>
  --
  onyomi : Array<String>
  kunyomi : Array<String>
  meaning_mnemonic : Text
  reading_mnemonic : Text
  stroke_order_svg : Text
}

class VocabularyDetail <<Entity>> {
  + unit_id : UUID <<PK, FK>>
  --
  reading : String
  audio_url : String
  parts_of_speech : Array<String>
  pitch_accent : JSONB
}

class GrammarDetail <<Entity>> {
  + unit_id : UUID <<PK, FK>>
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
  + type : Enum (synonym, antonym, similar, contrast, prerequisite)
}

' ==========================================
' 3. QUESTION DOMAIN
' ==========================================
class Question <<Entity>> {
  + id : UUID <<PK>>
  --
  unit_id : UUID <<FK>>
  facet : Enum (meaning, reading, cloze)
  type : Enum (fill_in, cloze)
  prompt : String
  cloze_text_with_blanks : String
  correct_answers : Array<String>
  hints : Array<String>
}

' ==========================================
' 4. PROGRESS & LOGGING
' ==========================================
class UserLearningState <<Entity>> {
  + user_id : UUID <<PK, FK>>
  + unit_id : UUID <<PK, FK>>
  + facet : Enum (meaning, reading, cloze) <<PK>>
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
  unit_id : UUID <<FK>>
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
  unit_id : UUID <<FK>>
  facet : Enum (meaning, reading, cloze)
  first_rating : Enum (again, good)
  attempts : Integer
  wrong_count : Integer
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
  referenced_unit_ids : Array<UUID>
  metadata : JSONB
}

class ChatMessageAction <<Entity>> {
  + id : UUID <<PK>>
  --
  message_id : UUID <<FK>>
  action_type : Enum (ANALYZE, SEARCH, MINE)
  target_unit_id : UUID <<FK>>
  target_sentence_id : UUID <<FK>>
}

' ==========================================
' 7. SENTENCE DOMAIN
' ==========================================
class Sentence <<Entity>> {
  + id : UUID <<PK>>
  --
  text_ja : String
  text_en : String
  origin : String
  source_text : String
  metadata : JSONB
  created_by : UUID <<FK>>
}

class UnitSentence <<Entity>> {
  + unit_id : UUID <<PK, FK>>
  + sentence_id : UUID <<PK, FK>>
  is_primary : Boolean
}

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
ChatMessage ||--o{ ChatMessageAction
ChatMessageAction }o..|| KnowledgeUnit : "targets"
ChatMessageAction }o..|| Sentence : "targets"
ChatMessage }o..|| KnowledgeUnit : "references"

' Sentences
User ||--o{ Sentence
Sentence ||--o{ UnitSentence
UnitSentence }o--|| KnowledgeUnit

@enduml
```

## Key Architectural Decisions

1. **Normalized Content Details**: To support diverse Knowledge Unit (Unit) types while maintaining a unified interface, core metadata is stored in `KnowledgeUnit`, while type-specific data resides in extension tables (`KanjiDetail`, etc.). This ensures efficient filtering and browsing across all content types.

2. **Transactional Lessons vs. Atomic Reviews (DB-Driven)**:
   - **Lessons**: Structured as batches. All quiz phases use questions fetched from the `Question` table (No Gen Quiz policy).
   - **Reviews**: Items are independent but use the **FIF (Failure Intensity Framework)**. Incorrect answers are tracked (Drill mode) and a correct answer triggers a single FSRS update with a weighted penalty. This ensures stability is only updated once per session per card, avoiding ease hell.

3. **FSRS Independence Law**: Progression is tracked per **facet** (e.g., you might know a word's meaning but not its reading). Each facet has its own record in `UserLearningState`, allowing for granular recall optimization.

4. **Circular Knowledge Graph**: The system implements explicit cross-referencing (e.g., `VocabularyKanji`, `KanjiRadical`). This allows the UI and the AI Chatbot to traverse the knowledge graph, providing context like "What radicals make up this Kanji?" or "What vocabulary uses this character?".

5. **Analytical Logging**: Every review event is logged in `UserLearningLog`. This provides the raw data necessary for generating heatmaps, retention curves, and precision statistics on the user's dashboard.
