
# Implementation Plan: YouTube Immersion (Phase 4)

## Objective
Implement the YouTube learning ecosystem, allowing users to import videos, fetch transcripts, and leverage the Sentence Analysis engine to mine context-rich flashcards.

## Phase 1: Research & Discovery
- [x] Identified test video: `https://www.youtube.com/watch?v=ApCnmHLHARM` (Cura Cura - TWICE).
- [x] Verified `youtube-transcript` and `youtube-captions-scraper` are in `package.json`.
- [x] Confirmed `user_youtube_videos` table schema in Supabase.

## Phase 2: Structured Planning
- [ ] Implement `YoutubeScraper`: Logic to fetch transcripts and video metadata.
- [ ] Implement `YoutubeService`: 
    - `importVideo(url, userId)`: Fetches metadata + transcript, saves to DB.
    - `processTranscript(videoId)`: Runs Stage 1-3 analysis on specific lines (using existing `SentenceService`).
- [ ] Define **Fixed Test Environment**: Create `src/features/youtube/constants.ts` to store the TWICE video link for consistent testing.

## Phase 3: Recursive Implementation

### 1. Scraper Layer (`src/features/youtube/scraper.ts`)
- [ ] Integration with `youtube-transcript` to get timestamped captions.
- [ ] Logic to clean and format captions into "sentences".

### 2. Service Layer (`src/features/youtube/service.ts`)
- [ ] **`syncVideo(url, userId)`**: Orchestrates fetching, DB saving, and initial coverage calculation.
- [ ] **`getCoverageSummary(videoId)`**: Calculates how many words in the video the user already knows (using CKB mapping).

### 3. DB Layer (`src/features/youtube/db.ts`)
- [ ] `saveUserVideo`: Save metadata to `user_youtube_videos`.
- [ ] `saveTranscript`: Save segments to `user_youtube_video_segments` (if needed) or directly link to `sentences`.

## Phase 4: Verification
- [ ] Script `scripts/test-youtube-import.ts`: Run a full import of the TWICE video.
- [ ] Verify captions are correctly tokenized and mapped to Knowledge Units.

## Phase 5: Code Quality & Review
- [ ] Maintain < 200 lines per file.
- [ ] Ensure proper error handling for "Transcript disabled" videos.

## Phase 6: Integration
- [ ] Update `docs/development-roadmap.md`.
