
# Implementation Plan: Decks & SRS Domain Logic (Phase 2)

## Objective
Implement the business logic and service layer for Deck management and SRS study sessions, ensuring a seamless flow from "Adding an item" to "Mastering it via FSRS".

## Phase 1: Research & Discovery
- [x] Verified current `learning` and `decks` feature structure.
- [x] Confirmed alignment with Slug-based identifiers.

## Phase 2: Structured Planning
- [ ] Define `StudyService` for handling SRS sessions.
- [ ] Define `DeckService` for managing deck-to-card relationships.
- [ ] Integrate `FSRSAlgorithm` results with `Supabase` persistence.
- [ ] Implement YouTube/Chat mining integration points (Business Logic only).

## Phase 3: Recursive Implementation

### 1. Learning Feature (`src/features/learning/`)
- [ ] **`service.ts`**: Create `LearningService` to orchestrate sessions.
  - `startSession(userId, deckId?)`: Fetches due cards and initializes a `StudySession`.
  - `submitReview(userId, kuId, rating)`: Calculates next state using `FSRSAlgorithm`, updates DB, and logs history.
- [ ] **`study-session.ts`**: (Done) Already manages card prioritization.

### 2. Decks Feature (`src/features/decks/`)
- [ ] **`service.ts`**: Create `DeckService`.
  - `createPersonalDeck(userId, name)`: Validates and creates.
  - `addCardToDeck(userId, deckId, kuId)`: Handles duplicate prevention and linking.
  - `getDeckStatistics(deckId)`: Calculates mastery percentage (analyzed vs learned).

### 3. Cross-Feature Logic
- [ ] **Stats Integration**: Ensure `LearningService` calls `analyticsService.incrementDailyStats` on every review.

## Phase 4: Verification
- [ ] Write integration test `tests/integration/study-flow.test.ts` to simulate a full learning loop.
- [ ] Verify FSRS transitions lead to 'Burned' state eventually.

## Phase 5: Code Quality & Review
- [ ] Ensure all services are stateless and follow the `src/features/` architecture.
- [ ] Check file lengths (< 200 lines).

## Phase 6: Integration
- [ ] Update `docs/project-changelog.md`.
