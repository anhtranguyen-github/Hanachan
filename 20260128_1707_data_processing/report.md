# Data Sufficiency Report vs ER Schema

**Date**: 2026-01-28 17:07
**Target Schema**: `docs/er/content-er.md`
**Source Folders**: `/kanji_vocab_process`, `/grammar_process`

---

## 1. Entity: KnowledgeUnit (Base)
- **Status**: ✅ **Fully Sufficient**
- **Fields Mapping**:
    - `id`: Generated on Insert (UUID)
    - `slug`: Available (Namespaced as `type:slug` in scripts)
    - `type`: Available (`radical`, `kanji`, `vocabulary`, `grammar`)
    - `level`: Available (Levels 1-60 for WK, N5-N1 for Bunpro mapped to Int)
    - `jlpt`: Available in Grammar data; inferred for Kanji/Vocab.
    - `character`: Available for all types.
    - `meaning`: Available for all types.
    - `created_at`: Auto-generated.

## 2. Entity: RadicalDetail
- **Status**: ✅ **Fully Sufficient**
- **Fields Mapping**:
    - `ku_id`: UUID relation.
    - `meaning_mnemonic`: Available in `radicals.json` -> `mnemonic`.
    - `image_url`: Available in `radicals.json` -> `mnemonic_image.src`.

## 3. Entity: KanjiDetail
- **Status**: ✅ **Fully Sufficient (Matches UI Screenshot)**
- **Fields Mapping**:
    - `onyomi`: Available in `kanji.jsonl`.
    - `kunyomi`: Available in `kanji.jsonl`.
    - `meaning_mnemonic`: Available in `kanji.jsonl` -> `meanings.mnemonic`.
    - `reading_mnemonic`: Available in `kanji.jsonl` -> `readings.mnemonic`.
    - `hints`: Available via `subject-hint__text` inside mnemonics.
    - `radical_combination`: Available in `kanji.jsonl` -> `radicals`.
    - `visually_similar`: Available in `kanji.jsonl` -> `visually_similar`.
    - `found_in_vocabulary`: Available in `kanji.jsonl` -> `amalgamations`.
    - `stroke_order_svg`: ⚠️ Still missing from raw data (as noted before).

## 4. Entity: VocabularyDetail
- **Status**: ✅ **Fully Sufficient (Matches UI Screenshot)**
- **Fields Mapping**:
    - `reading`: Available in `vocab.jsonl` -> `readings.primary`.
    - `audio_url`: Available in `vocab.jsonl` -> `readings.audio` (Verified actor names like Kyoko/Kenichi present).
    - `parts_of_speech` / `word_type`: Available in `vocab.jsonl` -> `meanings.word_types`.
    - `meaning_mnemonic`: Available in `vocab.jsonl` -> `meanings.explanation`.
    - `patterns_of_use` / `common_combinations`: Available in `vocab.jsonl` -> `collocations`.
    - `context_sentences`: Available in `vocab.jsonl` -> `context_sentences`.
    - `kanji_composition`: Available in `vocab.jsonl` -> `components`.
    - `pitch_accent`: ❌ **NOT FOUND** in WaniKani raw export (Optional for UI).

## 5. Entity: GrammarDetail
- **Status**: ✅ **Fully Sufficient**
- **Fields Mapping**:
    - `Structure`: Available (`structure.patterns`).
    - `Details`: Available (`details` object: part_of_speech, word_type, etc.).
    - `about`: Available (`about` object: text and description).
    - `Related`: Available (`synonyms`, `antonyms`, `related`).
    - `Examples`: Available (`examples` array).
    - `cautions`: Available (`cautions` array).

## 6. Relationships (Bridges)
- **KanjiRadicals**: ✅ Available in `kanji.jsonl` -> `radicals`.
- **VocabularyKanji**: ✅ Available in `vocab.jsonl` -> `components`.
- **GrammarRelations**: ✅ Available in `grammar.json` -> `synonyms`, `antonyms`, `related`.

## 7. Entity: Question
- **Status**: ⚠️ **To be derived**
- **Findings**: No pre-built question bank found. 
- **Feasibility**: 
    - `FILL_IN` / `CLOZE` questions can be generated automatically using `example_sentences` and `sentence_structure` hints found in `grammar.json`.
    - `MULTIPLE_CHOICE` requires logic to generate distractors from other KUs in the same level.

---

## Conclusion
The provided folders contain **~90%** of the data required by the `content-er.md` schema. 

**Critical Gaps**:
1. **Stroke Order SVGs**: Essential for Kanji learning but missing from raw data.
2. **Pitch Accent**: Missing for Vocabulary, which is a "nice-to-have" but expected in premium apps.
3. **Question Bank**: Not explicitly provided; needs a generation script or a separate source.
