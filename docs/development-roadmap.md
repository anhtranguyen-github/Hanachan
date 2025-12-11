# Hanachan V2: Master Development Roadmap

This roadmap outlines the path from foundation to a high-performance, AI-powered Japanese learning platform. All phases must adhere to the **Vibrant Sakura** aesthetic and **Hybrid-Centric** logic.

---

## 🏗️ Phase 1: Foundation & Architecture (UC-00 & UC-01)
*Goal: Solidify the platform's core architecture and knowledge exploration.*
- [x] **Architecture Refactor**: Enforced "Descriptive Naming" and "Clean-lite" structure (db/service/types).
- [x] **Constitution**: Established `PROJECT_DNA.md` and `architecture-nextjs-practical.md`.
- [x] **Project Scaffolding**: Modular feature structure (`src/features/`).
- [x] **Database Sync**: Supabase schema alignment, slug-based identifiers, and 1989+ seed sentences.
- [x] **AI Verification**: OpenAI API (GPT-4) connection confirmed and tested.
- [x] **UC-01 (Knowledge Browser)**: Core DB access logic refactored for Slug identifiers.
- [ ] **Next Up**: YouTube "Real Data" Integration (Phase 4 kickstart).

## 🎴 Phase 2: The Core Engine (UC-02)
*Goal: Implement the primary learning loop (Flashcards & FSRS).*
- [ ] **SRS Logic**: Integration of FSRS algorithm (`schedule.ts`) with `user_learning_states`.
- [ ] **System Decks (Fixed)**: 60-Level Standard Mastery curriculum.
- [ ] **Custom Decks (Dynamic)**: Infrastructure for user-generated decks.
- [ ] **Study Session UI**: High-performance, animation-rich flashcard renderer.

## 🔬 Phase 3: Sentence Intelligence (UC-03)
*Goal: Transition from word-learning to context-learning.*
- [x] **Sentence Analysis**: Implemented 4-stage engine (Local Tokenization -> KB Mapping -> AI Insight -> Smart Mining).
- [x] **Mining Workflow**: "One-click" creation of custom cards and linking to CKB.
- [x] **AI Refinement**: On-demand "Golden Sentence" generation and error detection.

## 📺 Phase 4: Multimedia Ecosystem (UC-04)
*Goal: Expand learning sources to real-world content.*
- [ ] **YouTube Integration**: Subtitle sync and context extraction.
- [ ] **Video Mining**: Creating flashcards directly from video timestamps.

## 🤖 Phase 5: Conversational Learning (UC-05)
*Goal: AI companionship and guidance.*
- [ ] **Sakura Assistant**: Context-aware AI Tutor.
- [ ] **Chat-to-Deck**: Generating study materials from conversations.

## 📈 Phase 6: Analytics & Optimization (UC-06)
*Goal: Data-driven progress (IMPORTANT) and final polish.*
- [ ] **Progress Dashboard**: Tracking levels, streaks, and coverage.
- [ ] **Retention Heatmaps**: Visualizing memory strength.
- [ ] **Performance Audit**: Database indexing and bundle optimization.
- [ ] **Project Finalization**: Documentation and code freeze.
