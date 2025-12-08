
# Implementation Plan: Sentence Analysis & Mining (Phase 3)

## Objective
Implement the 4-stage Sentence Analysis engine and the Smart Mining workflow to bridge the gap between "input text" and "SRS study materials".

## Phase 1: Research & Discovery
- [x] Analyzed `USE_CASE_DETAIL.md` for the 4-stage flow.
- [x] Verified `kuromoji` is in `package.json`.
- [x] Confirmed `knowledge_units` can be looked up via `slug`.

## Phase 2: Structured Planning
- [ ] Implement Stage 1 & 2: `TokenizationService` using `kuromoji`.
- [ ] Implement Stage 3: `AISentenceAnalyzer` to detect complex grammar and provide translations.
- [ ] Implement Stage 4: `MiningService` to handle "Quick Mine" and "Refine".
- [ ] Orchestrate everything in `SentenceService.analyze()`.

## Phase 3: Recursive Implementation

### 1. Tokenization Layer (`src/features/sentence/token-processor.ts`)
- [ ] Initialize `kuromoji` (handling dict path for Next.js environment).
- [ ] Create `tokenize` method to return Furigana, POS, and Base Form.
- [ ] Integrate CKB lookup to identify "In-system" words.

### 2. AI Layer (`src/features/sentence/ai-analyzer.ts`)
- [ ] Create a robust prompt for "Grammar Discovery" and "Cloze Suggestion".
- [ ] Parse AI response into structured JSON (matches `AnalysisHistory` schema).

### 3. Service Layer (`src/features/sentence/service.ts`)
- [ ] **`analyzeSentence(text)`**: One call to run Stage 1 -> 2 -> 3.
- [ ] **`refineSentence(text)`**: On-demand AI check for errors and "Golden Sentence" proposal.
- [ ] **`mineSentence(data)`**: Save to `sentences` and link to `ku_to_sentence`.

### 4. DB Layer (`src/features/sentence/db.ts`)
- [ ] Update `createSentence` to handle `source_metadata` and `text_ja/en`.

## Phase 4: Verification
- [ ] Unit tests for tokenizer.
- [ ] Integration tests for the full 4-stage flow (using OpenAI mock for Stage 3).

## Phase 5: Code Quality & Review
- [ ] Maintain < 200 lines per file.
- [ ] Use `error-handling-patterns`.

## Phase 6: Integration
- [ ] Update documentation and changelog.
