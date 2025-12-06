
# Implementation Plan: Core Management Features (Library, Deck, Analytics)

## Objective
Implement formatting and business logic for Video Library, Flashcard Service (Deck Management), and Analytics. Continue using **Local Storage (JSON)** for persistence to maintain velocity without DB blockers.

## Phase 1: Video Library (UC-04.1)
- [ ] **Data Model**: `VideoMetadata` (id, title, status, thumbnail, progress).
- [ ] **Service**: `VideoLibraryService`.
    - `listVideos()`: Get all imported videos.
    - `updateProgress(videoId, percent)`: Update learning progress.
    - `deleteVideo(videoId)`.
- [ ] **Integration**: Connect `YoutubeService` import to add to Library.

## Phase 2: Deck Management System (UC-02.4)
- [ ] **Algorithm**: Implement Basic FSRS (Free Spaced Repetition Scheduler) logic helper.
    - `calculateNextReview(card, rating)`.
- [ ] **Service**: `DeckService` (The SRS Hub).
    - `createCard(sourceType, sourceId, content)`: "Mine" a card.
    - `getDueCards()`: Filter cards where `nextReview < now`.
    - `submitReview(cardId, rating)`: Update card state using FSRS logic.
    - `stats()`: Get breakdown (New, Learning, Review, Mastered).

## Phase 3: Analytics (UC-06)
- [ ] **Service**: `AnalyticsService`.
    - `getCoverageStats()`: Calculate % of "Known Words" vs Total unique words in Library.
    - `getDailyActivity()`: Log review counts per day.

## Phase 4: Integration Script
- [ ] `scripts/test-management-core.ts`:
    - Import a video.
    - Mine a sentence from it -> Deck.
    - Review that card -> Update Stats.
    - Display Library + Analytics Dashboard.
