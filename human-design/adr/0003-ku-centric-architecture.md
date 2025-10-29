# ADR-0003: Knowledge-Unit (KU) Centric Architecture

## Status

Accepted

## Context

The system was initially drifting towards a "Flashcard-centric" design, where learning was tied to the concept of a flashcard deck. However, Hanachan's value lies in **multi-source immersion** (YouTube, Chat, AI Analysis). 

If learning state is tied only to flashcards, we lose the connection when a student encounters the same word in a YouTube video or a chat session.

## Decision Drivers

- **Knowledge Consistency**: A word's learning state should be consistent across all system features.
- **Sentence-Centric Entry**: Learning should be discoverable from authentic context (sentences).
- **Reduced Redundancy**: CKB (Core Knowledge Base) should be the single source of truth for linguistic data.

## Decision

Shift the architecture to be **KU-Centric**.

1.  **Identity**: A Knowledge Unit (KU) is the atomic unit of learning (Radical, Kanji, Vocab, or Grammar).
2.  **State**: The `LearningState` (SRS data) is attached to the `ku_id`, not to a flashcard.
3.  **Discovery**: Sentences are "Discovery Artifacts". The `analysis` module maps parts of a sentence to existing KUs in the CKB.
4.  **Presentation**: Flashcards, YouTube HIGHLIGHTS, and Chatbot suggestions are merely different **views** or **renderers** of the same KU+LearningState pair.

## Consequences

### Positive
- **Cross-Module Sync**: Learning a word in a Flashcard session automatically "unlocks" or updates its status in the YouTube immersion view.
- **Scalable Content**: We can add new source types (e.g., News reader, Podcast) without changing the learning engine.
- **Rich Context**: A KU can now link back to multiple "Mined Sentences" for better example variety.

### Negative
- **Mapping Complexity**: Requires a robust `analysis` module to accurately map sentence fragments to CKB IDs.
- **Database Schema Migration**: Needs a clear separation between `CKB_Items` and `User_Learning_State`.
