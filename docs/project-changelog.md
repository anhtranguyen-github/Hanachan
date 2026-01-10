# Project Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-01-26
### Changed
- **Global**: Performed a project-wide code formatting and whitespace cleanup to maintain consistency across 200+ files.

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
