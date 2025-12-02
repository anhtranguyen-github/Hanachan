
# Implementation Plan: Database Layer Logic Validation

## Objective
Thoroughly validate and synchronize all database access logic (`db.ts` files) across all feature modules to align perfectly with the finalized Supabase schema (Slug-based identifiers, multi-user safety, simplified settings, and naming conventions like `text_ja/text_en`).

## Phase 1: Research & Discovery
- [x] Read `docs/constitution/PROJECT_DNA.md` and `docs/constitution/architecture-nextjs-practical.md`.
- [x] Activate relevant skills: `supabase-best-practices`, `error-handling-patterns`.
- [x] Analyze existing `db.ts` files and compare with the final schema.

## Phase 2: Structured Planning
- [x] Create this implementation plan.
- [ ] List all mismatches between current `db.ts` files and the final schema.

## Phase 3: Recursive Implementation
Follow the "Feature-Oriented" architecture. For each feature, verify and fix:
1.  **Identifier Usage**: Ensure `ku_id` uses `slug` (text) and not `id` (uuid) for joins and lookups.
2.  **Naming Alignment**: Use `text_ja` instead of `content` or `text_content` in `sentences` and `analysis_history`.
3.  **Multi-User Safety**: Ensure all queries include `user_id` filters where appropriate.
4.  **Simplified Settings**: Reflect the removal of study limits in `user_settings`.
5.  **Analytics Sync**: Ensure `minutes_spent` is used for time tracking.

### TODO Tasks by Feature:

#### Knowledge Feature (`src/features/knowledge/db.ts`)
- [ ] Verify `getBySlug` and `getById` both use the `slug` for detail joins.
- [ ] Ensure `search` returns `slug` as the `id`.

#### Learning Feature (`src/features/learning/db.ts`)
- [ ] Update `getDueCards` join to use `ku_id` (slug) instead of checking `id`.
- [ ] Update `updateLearningState` to use `ku_id` (slug) for upsert.
- [ ] Update `logReviewHistory` to use `ku_id` (slug).
- [ ] Verify `getLearningSettings` only fetches `fsrs_weights` and `target_retention`.

#### Sentence Feature (`src/features/sentence/db.ts`)
- [ ] Update `getSentenceById` to use the correct column names (`text_ja`, `text_en`).
- [ ] Update `getSentencesByKU` to join via `ku_id` (slug).
- [ ] Update `createSentence` to handle `text_ja` and `user_id`.

#### Decks Feature (`src/features/decks/db.ts`)
- [ ] Update `getDeckItems` to join `knowledge_units` via `ku_id` (slug).
- [ ] Ensure `updateInteraction` uses `slug`.

#### Analytics Feature (`src/features/analytics/db.ts`)
- [ ] Ensure `getDailyStats` and `incrementDailyStats` use `minutes_spent`.

#### YouTube Feature (`src/features/youtube/db.ts`)
- [ ] Verify `status` mapping (`new`, `processing`, `analyzed`).

#### Auth Feature (`src/features/auth/db.ts`)
- [ ] Verify `getUserProfile` and `getUserSettings` match the simplified schema.

## Phase 4: Verification
- [ ] Run `vitest` for all features to ensure no regressions in domain logic.
- [ ] Manually verify SQL query syntax for potential edge cases.

## Phase 5: Code Quality & Review
- [ ] Verify all files are under 200 lines.
- [ ] Ensure `error-handling-patterns` are applied.

## Phase 6: Integration & Documentation
- [ ] Update `docs/development-roadmap.md` if necessary.
- [ ] Finalize the "Database Standard" documentation.
