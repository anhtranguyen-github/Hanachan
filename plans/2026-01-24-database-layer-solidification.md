# Plan: Database Layer Solidification (The Foundation)

**Objective**: Establish a robust, type-safe, and verified database access layer for all features using Supabase.

**Scope**:
- Implementation of `db.ts` and `types.ts` for all features.
- Mapping TypeScript interfaces strictly to Supabase tables.
- Verification scripts for each feature's DB operations.
- **Strictly No UI or Business Services**.

## Phase 1: Research & Mapping
- [ ] Deep dive into `dbsu/schema/master_init.sql` to map every table to a feature.
- [ ] Verify existing `db.ts` implementations (`knowledge`, `learning`) for completeness.
- [ ] Ensure Supabase client is correctly configured for both Server and Client use.

## Phase 2: Implementation (Feature by Feature)

### 1. Auth Feature (`auth`)
- **Tables**: `users`, `user_settings`.
- **Operations**:
    - `getUserProfile(userId)`
    - `updateUserProfile(userId, data)`
    - `getUserSettings(userId)`
    - `updateUserSettings(userId, settings)`
- **Types**: `User`, `UserSettings`.

### 2. Sentence Feature (`sentence`)
- **Tables**: `sentences`, `ku_to_sentence`.
- **Operations**:
    - `getSentenceById(id)`
    - `getSentencesByKU(kuId)`
    - `createSentence(data)`
    - `linkKUToSentence(kuId, sentenceId, metadata)`
- **Types**: `Sentence`, `KUToSentence`.

### 3. Decks Feature (`decks`)
- **Tables**: `decks`, `deck_items`, `deck_item_interactions`.
- **Operations**:
    - `getUserDecks(userId)`
    - `getDeckWithItems(deckId)`
    - `createDeck(userId, name, type)`
    - `addItemsToDeck(deckId, kuIds)`
    - `updateInteraction(userId, deckId, kuId, state)`
- **Types**: `Deck`, `DeckItem`, `DeckInteraction`.

### 4. YouTube Feature (`youtube`)
- **Tables**: `user_youtube_videos`.
- **Operations**:
    - `getUserVideos(userId)`
    - `addVideo(userId, videoData)`
    - `updateVideoStatus(userId, videoId, status)`
- **Types**: `UserVideo`.

### 5. Chat & Analytics Features
- **Tables**: `user_analysis_history`, `user_daily_stats`.
- **Operations**:
    - `logAnalysis(userId, text, result)`
    - `getDailyStats(userId, date)`
    - `incrementStats(userId, type, increment)`
- **Types**: `AnalysisHistory`, `DailyStats`.

## Phase 3: Verification Script
- [ ] Create `scripts/verify-db-layer.ts` that imports and tests key functions from each `db.ts`.
- [ ] Run verification against the live Supabase instance.

## Phase 4: Integration Clean-up
- [ ] Ensure all `index.ts` files export the database functions/repositories.
- [ ] Remove any leftover legacy files or folders within features.
