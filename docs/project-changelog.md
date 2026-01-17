# Project Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-01-26
### Changed
- **UI/UX**: Rebuilt the entire frontend with a **Claymorphism** design system.
  - Implemented custom Tailwind config for soft 3D shadows and rounded corners.
  - Added Noto Sans JP and Noto Serif JP fonts.
- **Architecture**: Switched to a **Mock-Only** data layer for all features.
  - Integrated `src/lib/mock-db` into all routes.
  - Removed Supabase dependencies and related boilerplate code to achieve a minimal stack.
- **Features**: Implemented full functional flows for:
  - **Dashboard**: Interactive progress overview.
  - **Learn**: End-to-end SRS study session (Queue -> Grade -> Result).
  - **Content**: Detailed lists for Kanji, Vocabulary, Grammar, and Sentences with learning status.
  - **Learn Evolution**: Implemented custom deck creation and a global SRS overview dashboard.
- **Analytic Overhaul**: Revamped the main dashboard with Level/XP systems, review forecasts, and retention analysis diagrams.
- **Immersion**: YouTube player shell, Sentence Analyzer with mock tokens, and AI Chatbot UI.
- **Chatbot Evolution**: Added conversation history sidebar and multi-session support with MockDB integration.
- **Sentence Insights**: Detailed view for mined phrases with morphological breakdown and source context.
- **Analyzer Upgrades**: Interactive modals for deep-dives into grammar points and individual tokens directly from the analyzer.
- **Cleanup**: Removed unused scripts (`check_users.ts`), redundant packages, and auth callback routes.
- **Fixes**:
  - Resolved `next/font` weight errors for Noto Sans/Serif JP.
  - Fixed `ReferenceError` for missing `Link` imports and `stage` variables across library pages.
  - Ensured all functional links to detail pages are active and correctly typed.


## [Unreleased] - 2026-01-24
### Refactored
- **Architecture**: Enforced "Clean-lite" structure across all `src/features/`.
  - Renamed `analysis` to `sentence`.
  - Standardized all features to use `db.ts`, `service.ts`, `types.ts`, `index.ts`.
  - Removed "antibattery" folders (`domain`, `infrastructure`, `hooks`).
- **Naming Convention**: Adopted "Descriptive Naming" (e.g., `schedule.ts` vs `fsrs.engine.ts`).
- **Database Layer**: Synchronized all feature repositories with the final Supabase schema.
  - Standardized identifier usage: Switched from UUID `id` to `slug` for internal app logic and joins.
  - Simplified `user_settings`: Removed study limits and synchronized with minimal schema.
  - Verified 1100 KUs and 1989 Sentences seeded correctly.
- **Knowledge Module**: Split repository into `db.ts` and `mapper.ts` to adhere to the < 200 lines rule.

- **Decks & SRS Intelligence**:
  - Implemented `LearningService`: Orchestrates FSRS review cycles and stats tracking.
  - Implemented `DeckService`: Handles personal deck management and membership.
  - Developed `AnalyticsService`: Tracks learning progress (New vs Review) and time spent.
  - Integrated `FSRSAlgorithm` with Supabase persistence.
  - Added comprehensive integration tests (48/48 Passed).

- **Sentence Intelligence Engine**:
  - Implemented 4-stage Analysis (`SentenceService`):
    - **Stage 1 (Local)**: High-speed tokenization using `kuromoji`.
    - **Stage 2 (Mapping)**: Automatic CKB lookup via Slug verification.
    - **Stage 3 (AI)**: Advanced grammar discovery and contextual translation (OpenAI). Integrated **Zod Structured Outputs** to guarantee response consistency.
    - **Stage 4 (Mining)**: Smart mining with source tracking and automatic CKB linking.
  - Added `AISentenceAnalyzer`: Handles complex linguistic insights and "Golden Sentence" refinement using `withStructuredOutput`.

### AI & Services
- **Verification**: OpenAI API (GPT-4) connection confirmed and tested.
- **YouTube Strategy**: Defined a direct synchronous import approach for transcripts to speed up early development.

### Documentation
- **Consolidated**: Merged dispersed design docs into `USE_CASE_DETAIL.md` and `PACKAGE_STRUCTURE.md`.
- **Constitution**: Created `PROJECT_DNA.md` as the single source of truth for architectural rules.
- **Workflow**: Updated `dev-pro.md` to enforce strict "Critical Rules", `database_schema_final.md` context, and `error-handling-patterns`.

### Added
- Professional Development Skills in `.agents/skills/`.
- Master Production Workflow in `.agents/workflows/dev-pro.md`.
## [2026-01-27] Unified Quick View System
- **Type**: UI/UX & Logic
- **Changes**: 
    - Created `QuickViewModal` shared component for words and grammar.
    - Integrated modal triggers in Sentence Detail, YouTube Player, Sentence Analyzer, and Chatbot.
    - Standardized token and grammar point interactions across the platform.
- **Reasoning**: To provide a seamless, non-disruptive learning experience where users can deeply explore linguistic details without context-switching.
