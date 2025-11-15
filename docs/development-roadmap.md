# Hanachan V2: Master Development Roadmap

This roadmap outlines the path from foundation to a high-performance, AI-powered Japanese learning platform. All phases must adhere to the **Vibrant Sakura** aesthetic and **Hybrid-Centric** logic.

---

## 🏗️ Phase 1: Foundation & Infrastructure (UC-01)
*Goal: Solidify the platform's core knowledge base and navigation.*
- [x] **Project Scaffolding**: Modular monolith structure in `src/features/`.
- [x] **Database Sync**: Supabase schema alignment, lowercase Enums, and Trigram search.
- [x] **Vibrant Design System**: `design.config.ts` v5 implementation (Semantic Darks, No-Glass).
- [ ] **UC-01.1/2: Knowledge Browser**: High-performance exploration for 8000+ Vocab, Kanji, and Radicals. 
- [ ] **UC-01.3: Personalization Layer**: Individual learning states (ULS) per Knowledge Unit (KU).

## 🎴 Phase 2: The SRS Heart (UC-02)
*Goal: Implement the core learning loop using FSRS.*
- [ ] **SRS Core Engine**: Integration of FSRS algorithm with `user_learning_states`.
- [ ] **UC-02.1: 60-Level Standard Mastery**: Adaptive flashcards (Character-Meaning format).
- [ ] **UC-02.2: Daily Review System**: Smart queue management using `idx_uls_schedule`.
- [ ] **UC-02.4: Mining Bridge**: Creating study items from context (initial implementation).

## 🔬 Phase 3: Sentence Intelligence (UC-03)
*Goal: Transition from word-learning to context-learning (Sentence-Centric).*
- [ ] **UC-03.1: Universal Analyzer**: Server-side parsing of Japanese sentences into CKB mappings.
- [ ] **UC-03.2/3: Discovery Engine**: Automatic detection of Grammar and Vocab patterns within text.
- [ ] **UC-03.5: AI Refinement**: On-demand LLM feedback for sentence naturalness.
- [ ] **Hybrid Grammar Cards**: Implementing "Sentence - Cloze" card format (MANDATORY for grammar).

## 📺 Phase 4: Multimedia Ecosystem (UC-04)
*Goal: Expand learning sources to real-world content.*
- [ ] **YouTube Sync**: Subtitle extraction and timestamp management.
- [ ] **Video-to-SRS Flow**: One-click "Mining" from YouTube subtitles to the SRS queue.
- [ ] **Discovery Artifacts**: Preserving video context within Knowledge Unit flashcards.

## 🤖 Phase 5: Conversational Learning (UC-05)
*Goal: AI companionship and guidance.*
- [ ] **Sakura Assistant**: LangGraph-powered chatbot that remembers user SRS history.
- [ ] **UC-05.2: Adaptive Explainer**: CKB-aware responses tailored to the user's current level.
- [ ] **Chat-based Reviews**: Conducting SRS sessions through the chat interface.

## 📈 Phase 6: Mastery & Performance (UC-06)
*Goal: Data-driven progress and final polish.*
- [ ] **UC-06.1-4: Progress Dashboard**: Vibrant analytics using Bento Grid layout.
- [ ] **Master Performance Audit**: DB Index cleanup and asset optimization.
- [ ] **Project Finalization**: Documentation engine sweep for Graduation submission.
