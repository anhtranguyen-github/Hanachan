# Human-Design: Use Case Specifications (Refined)

This document outlines the core interactions, emphasizing the **Sentence -> Analysis -> KU** learning loop.

## 1. Core Learning Loop (The "Trục" chính)

### UC-03: Sentence Analysis (Central Use Case)
- **Actor**: Student, Hana AI
- **Goal**: Deconstruct a sentence into learnable Knowledge Units (KU).
- **Flow**:
  1. Student encounters a sentence (from YouTube, Chat, or Manual Input).
  2. System triggers `analysis` module.
  3. **On-demand Refinement** (Optional): Student clicks "Refine" to get an AI assessment, grammar score, and a suggested "Golden Sentence" fix with explanation.
  4. Hana AI identifies Radicals, Kanji, Vocab, and Grammar points.
  5. System attempts to map these points to the **Core Knowledge Base (CKB)**.
  6. **Sentence Mining**: If a match is found, the sentence is linked to the KU's "Usage Pocket" (Sentence Pocket).

## 2. Study & Retention

### UC-02: SRS Study (Flashcards)
- **Actor**: Student
- **Goal**: Review items currently due in the user's `learning` queue.
- **Key Note**: Flashcards are just a **view** of a KU. The card content is pulled from `ckb`, and the review timing is managed by the `learning` module.

### UC-01: Personal Knowledge Management
- **Actor**: Student
- **Goal**: Browse and personalize their learning path.
- **Action**: Students can "bookmark" or "add to deck" specific KUs discovered during sentence analysis.

## 3. Supplementary Modes

### UC-04: YouTube Immersion
- Providing the primary source for "Sentences".
- Synchronization of transcripts with the learning state of KUs (highlighting known vs. unknown words).

### UC-05: AI Tutor (Chatbot)
- Context-aware support. The chatbot knows which KUs the student is struggling with (via `learning_state`) and uses them in conversations.

## 4. Administrative & Analytics
- Progress tracking across levels (1-60).
- Memory strength visualization (SRS heatmaps).
