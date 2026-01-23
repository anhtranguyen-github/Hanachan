# Content Domain ER Diagram

```plantuml
@startuml
skinparam packageStyle rectangle
skinparam classAttributeIconSize 0
hide circle

' ==========================================
' BASE ENTITY
' ==========================================
class KnowledgeUnit <<Entity>> {
  + id : UUID
  --
  slug : String
  type : Enum (RADICAL, KANJI, VOCAB, GRAMMAR)
  level : Integer (1-60)
  jlpt : Integer (5-1)
  character : String
  meaning : String
  created_at : Timestamp
}

' ==========================================
' DETAIL ENTITIES (Extension-like 1:1)
' ==========================================
class RadicalDetail <<Entity>> {
  + ku_id : UUID <<FK>>
  --
  meaning_mnemonic : Text
  image_url : String
}

class KanjiDetail <<Entity>> {
  + ku_id : UUID <<FK>>
  --
  onyomi : Array<String>
  kunyomi : Array<String>
  meaning_mnemonic : Text
  reading_mnemonic : Text
  stroke_order_svg : Text
}

class VocabularyDetail <<Entity>> {
  + ku_id : UUID <<FK>>
  --
  reading : String
  audio_url : String
  parts_of_speech : Array<String>
  pitch_accent : JSONB
  meaning_mnemonic : Text
}

class GrammarDetail <<Entity>> {
  + ku_id : UUID <<FK>>
  --
  structure : String
  explanation : Text
  nuance : Text
  cautions : Text
  external_links : JSONB
  example_sentences : JSONB
}

' ==========================================
' RELATIONSHIP (CROSS-REFERENCING)
' ==========================================
class KanjiRadicals <<Bridge>> {
  kanji_id : UUID <<FK>>
  radical_id : UUID <<FK>>
  position : Integer
}

class VocabularyKanji <<Bridge>> {
  vocab_id : UUID <<FK>>
  kanji_id : UUID <<FK>>
  position : Integer
}

class GrammarRelations <<Bridge>> {
  grammar_id : UUID <<FK>>
  related_id : UUID <<FK>>
  type : Enum (SYNONYM, ANTONYM, CONTRAST)
}

' ==========================================
' CONNECTIONS
' ==========================================
KnowledgeUnit ||--|| RadicalDetail
KnowledgeUnit ||--|| KanjiDetail
KnowledgeUnit ||--|| VocabularyDetail
KnowledgeUnit ||--|| GrammarDetail

KanjiDetail }o--o{ KanjiRadicals
RadicalDetail }o--o{ KanjiRadicals

VocabularyDetail }o--o{ VocabularyKanji
KanjiDetail }o--o{ VocabularyKanji

GrammarDetail }o--o{ GrammarRelations

' ==========================================
' QUESTION LINK (Transition to Learning)
' ==========================================
class Question <<Entity>> {
  + id : UUID
  --
  ku_id : UUID <<FK>>
  type : Enum (FILL_IN, CLOZE, MULTIPLE_CHOICE)
  prompt : String
  cloze_text : String
  correct_answers : Array<String>
  hints : Array<String>
}

KnowledgeUnit ||--o{ Question

@enduml
```

## Key Architectural Decisions

1. **Table-per-Type Inheritance**: `KnowledgeUnit` acts as the base class for all learning materials. This allows for a unified `UserLearningState` (SRS) regardless of whether it's a Kanji or a Grammar point.
2. **Deep Cross-Referencing**:
   - **Kanji-Radical**: Allows users to see every component of a Kanji.
   - **Vocab-Kanji**: Allows users to jump from a word to the Kanji detail page to learn individual components.
   - **Grammar Similarity**: Helps users differentiate between confusingly similar grammar points (Bunpro style).
3. **Multi-Cloze Questions**: The `correct_answers` and `hints` are arrays, enabling questions with multiple blank spots in a single sentence.
