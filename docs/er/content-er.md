# Content Domain ER Diagram

This diagram focuses on the static knowledge base of the Hanachan platform, including the hierarchical relationships between radicals, kanji, vocabulary, grammar, and sentences.

```plantuml
@startuml
skinparam packageStyle rectangle
skinparam classAttributeIconSize 0
hide circle

' ==========================================
' BASE ENTITY
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
  created_at : Timestamp
}

' ==========================================
' DETAIL ENTITIES (Extension-like 1:1)
' ==========================================
class RadicalDetail <<Entity>> {
  + unit_id : UUID <<PK, FK>>
  --
  name : String
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
  stroke_video_url : String
}

class VocabularyDetail <<Entity>> {
  + unit_id : UUID <<PK, FK>>
  --
  reading : String
  audio_url : String
  parts_of_speech : Array<String>
  pitch_accent : JSONB
  meaning_mnemonic : Text
}

class GrammarDetail <<Entity>> {
  + unit_id : UUID <<PK, FK>>
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
class KanjiRadical <<Entity>> {
  + kanji_id : UUID <<PK, FK>>
  + radical_id : UUID <<PK, FK>>
  position : Integer
}

class VocabularyKanji <<Entity>> {
  + vocab_id : UUID <<PK, FK>>
  + kanji_id : UUID <<PK, FK>>
  position : Integer
}

class GrammarRelation <<Entity>> {
  + grammar_id : UUID <<PK, FK>>
  + related_id : UUID <<PK, FK>>
  type : Enum (synonym, antonym, similar, contrast, prerequisite)
  comparison_note : Text
}

' ==========================================
' QUESTION DOMAIN
' ==========================================
class Question <<Entity>> {
  + id : UUID <<PK>>
  --
  unit_id : UUID <<FK>>
  type : Enum (fill_in, cloze)
  facet : Enum (meaning, reading, cloze)
  prompt : String
  cloze_text_with_blanks : String
  correct_answers : Array<String>
  hints : Array<String>
}

' ==========================================
' SENTENCE DOMAIN
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

' ==========================================
' CONNECTIONS
' ==========================================
KnowledgeUnit ||--o| RadicalDetail
KnowledgeUnit ||--o| KanjiDetail
KnowledgeUnit ||--o| VocabularyDetail
KnowledgeUnit ||--o| GrammarDetail
KnowledgeUnit ||--o{ Question
KnowledgeUnit ||--o{ UnitSentence
Sentence ||--o{ UnitSentence

' Cross-Refs
KanjiRadical }o--|| KnowledgeUnit : "is composed of"
VocabularyKanji }o--|| KnowledgeUnit : "is composed of"
GrammarRelation }o--|| KnowledgeUnit : "is related to"

@enduml
```

## Key Architectural Decisions

1. **Table-per-Type Inheritance**: `KnowledgeUnit` acts as the base class for all learning materials. This allows for a unified `UserLearningState` (SRS) regardless of whether it's a Kanji or a Grammar point. Type-specific extensions are handled via 1:1 detail tables (`RadicalDetail`, `KanjiDetail`, etc.).

2. **Deep Cross-Referencing**:
   - **Kanji-Radical**: Essential for building mnemonics and understanding Kanji structure.
   - **Vocab-Kanji**: Enables the "Discovery" flow where users can explore Kanji components directly from a word.
   - **Grammar Similarity**: Supports the `grammar_relations` table to help users differentiate between confusingly similar particles or structures via `comparison_note`.

3. **Multi-Facet Questioning**: A single `KnowledgeUnit` can have multiple `Questions` linked to different facets (Meaning, Reading, or Cloze). This supports the **Independence Law** where facets are tracked separately in SRS.

4. **Integrated Sentences**:
   - Sentences can be linked to any `KnowledgeUnit` via `UnitSentence`.
   - `is_primary` flag helps determine which sentence should be shown as the main example.
   - Sentences can also be associated with grammar points via `GrammarDetail.example_sentences` (JSONB) for simpler cases or the `Sentence` table for shared/analyzed examples.

5. **No Gen Quiz Policy**: All questions used in learning and review sessions are stored in the `Question` table. There is no automated question generation from templates at runtime, ensuring data quality and consistency.
