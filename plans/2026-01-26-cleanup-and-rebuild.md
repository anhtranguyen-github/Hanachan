# Plan: Project Cleanup and Frontend Rebuild (HanaChan V2)

## 1. Objective
Transform the codebase into a minimal, lightweight Japanese learning application with a premium "Claymorphism" UI. The app will use strictly mock data based on `schema.sql` and implement all business flows from `docs/business/`.

## 2. Phase 1: Cleanup & Minimalism
- [ ] Remove Supabase dependencies and related boilerplate.
- [ ] Clean up `node_modules` and re-install with `pnpm`.
- [ ] Remove unused files (e.g., `check_users.ts`, empty directories).
- [ ] Consolidate redundant files in `src/features`.

## 3. Phase 2: Design System (Premium UI)
- [ ] Update `globals.css` with HSL variables for Claymorphism.
- [ ] Implement Noto Sans JP and Noto Serif JP via Google Fonts.
- [ ] Define reusable UI components (Button, Card, Input) with soft 3D effects.

## 4. Phase 3: Data Layer (Mock Only)
- [ ] Expand `src/lib/mock-db` to cover all entities in `schema.sql`:
    - Knowledge Units (Radical, Kanji, Vocab, Grammar)
    - Decks & Flashcards
    - Sentences & YouTube Subtitles
    - FSRS Learning States
- [ ] Ensure the mock DB replicates the database-like behavior (filtering, updating).

## 5. Phase 4: Frontend Implementation (End-to-End Flows)
- [ ] **Navigation**: Sidebar with Dashboard, Learn, Content (nested), Immersion (nested).
- [ ] **Dashboard**: Progress overview, daily goals, quick actions.
- [ ] **Learn**: Deck-based SRS flow (Start -> Queue -> Grade -> Update).
- [ ] **Content Views**:
    - Kanji list/detail (showing learning stage).
    - Vocabulary list/detail (showing learning stage).
    - Grammar list/detail.
    - Sentences list.
- [ ] **Immersion**:
    - **Analyzer**: Page to paste text and see tokenized/analyzed output.
    - **YouTube**: Video player with interactive subtitles.
    - **Chatbot**: Chat interface for Q&A and analysis.

## 6. Phase 5: Verification & Polish
- [ ] Verify all routes are accessible.
- [ ] Ensure smooth transitions and interactive feedback (hover/active states).
- [ ] Audit code size and structure (max 200 lines per file where possible).

## 7. Error Handling Strategy
- [ ] Implement `error.tsx` and `loading.tsx` for all main routes.
- [ ] Defensive Zod validation for any mock data fetching.

## 8. Development Order
1. Cleanup (Dependencies + Files).
2. Data Layer (Mocks).
3. Core Layout & Navigation.
4. Feature Implementation (dashboard -> content -> learn -> immersion).
