
# Implementation Plan: Full YouTube Learning Feature (Local Storage)

## Objective
Implement end-to-end YouTube learning flow: Import -> Playback -> Analyze Sentence -> Mine. All persistence temporarily uses Local Storage JSON files.

## Phase 1: Service Layer (Backend Logic)
- [x] `YoutubeScraper`: Multi-strategy fetching + Patching.
- [x] `LocalTranscriptRepo`: Save/Load raw transcripts.
- [ ] **NEW**: `YouTubeLearningService`:
    - `analyzeSegment(videoId, segmentIndex)`: 
        - Get text from local transcript.
        - Run `SentenceService.analyze()`.
        - Save analysis result to `data/analyses.json`.
    - `getVideoMetadata(videoId)`: Manage video details locally.

## Phase 2: Domain Logic (Headless)
- [ ] Create `scripts/simulate-youtube-learning.ts`:
    - Simulate User selecting a video.
    - Simulate "Playing" (printing segments with timestamps).
    - Simulate "Pausing & Clicking" a sentence (e.g., at 6:01).
    - Trigger Analysis.
    - Display full analysis results (Meaning, Grammar, Furigana).

## Phase 3: Data Structure (Local JSON)
- `data/videos.json`: Metadata (Title, ID, Thumb).
- `data/transcripts.json`: Full text segments.
- `data/analyses.json`: Cache of analyzed sentences (to avoid re-calling OpenAI).

## Phase 4: Execution
1. Create `src/features/youtube/learning-service.ts`.
2. Create `scripts/full-youtube-flow.ts`.
3. Verify the "Shirakawago 6:01" case again in this full flow.
