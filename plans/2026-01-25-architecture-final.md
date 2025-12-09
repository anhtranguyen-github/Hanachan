
# Final Sentence Mining Architecture: "Sentence as Root"

## 1. Philosophy
Instead of treating Sentences, Vocab, and Grammar as isolated items, we create a hierarchy:
- **Root**: The Mined Sentence (Source of Truth & Context).
- **Derivatives**: Flashcards created **FROM** that sentence.

## 2. Interaction Flow
1.  **Mine Sentence**: User finds a sentence in a video. Clicks "Mine".
    - System saves the Sentence (Text, Translation, Timestamp, VideoID).
2.  **Card Generation**:
    - System analyzes sentence -> Displays list of KUs (Vocab + Grammar).
    - User selects items to learn (e.g., "Neko", "Taberu", "Particle Ga").
3.  **SRS Creation**:
    - Flashcards are created for selected items.
    - **Crucial**: Each card holds a `sentence_id` reference.
    - **Frontend View**: When reviewing "Neko", the card automatically fetches the linked "Sentence" to show as hints/audio.

## 3. Data Model Implications
*   `sentences` Table: Stores the "Raw Material".
*   `user_learning_states` (SRS): Stores progress for specific Slugs (Vocab/Grammar). Linked to Sentence via `context_sentence_id`.

## 4. Frontend Strategy
*   **Video Player**: Main action is "Mine Sentence".
*   **Post-Mine Modal**: "What do you want to learn from this sentence?" (Checklist of words/grammar).

This architecture ensures zero context loss and maximum flexibility.
