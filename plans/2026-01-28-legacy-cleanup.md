# Legacy cleanup plan - 2026-01-28

## Objective
Streamline the Hanachan v2 codebase by removing legacy features, redundant logic, and unused app routes. Focus on maintaining a "Clean & Lean" architecture as per the `super-dev-pro` workflow.

## 1. Feature Cleanup (High Impact)
The following feature directories appear to be legacy and are no longer referenced in the main navigation or core learning flow.

- **`src/features/youtube`**: Complete removal. Logic for transcription, scraping, and YouTube interaction is no longer part of the immersion strategy (replaced by Chatbot).
- **`src/features/analysis`**: Complete removal. Unused sentence analysis logic.
- **`src/features/mining`**: Complete removal. This includes the `MiningInterface` component. Hybrid AI pattern matching logic is being consolidated into the Chatbot's knowledge retrieval layer if needed.
- **`src/features/sentence`**: Audit and consolidate. If Chatbot doesn't use it directly, remove it.

## 2. Route Cleanup (Frontend Surface)
Remove unlinked pages and their associated API routes to reduce the application's attack surface and bundle size.

- **`src/app/(main)/mining`**: Delete folder. This page is no longer in the sidebar.
- **`src/app/(main)/content/sentences`**: Delete if it remains (currently unlinked).
- **`src/app/api/yt`**: (Search to verify if exists, then delete).
- **`src/app/api/whisper`**: (Search to verify if exists, then delete).
- **`src/app/api/debug-analyze`**: Delete empty/unused directory.

## 3. Library & Utility Consolidation
Address duplication in the `src/lib` directory.

- **Consolidate Validations**: Merge `src/lib/validation.ts` and `src/lib/validations.ts` into a single, Zod-driven schema file.
- **Unused Parsers**: Audit `src/lib/ku-parser.ts` to see if it's used by anything other than legacy seed scripts.

## 4. Documentation Audit
- Update `docs/development-roadmap.md` to reflect the removal of YouTube immersion.
- Update `docs/project-changelog.md` with a "Logic/Cleanup" entry once executed.

## 5. Execution Order (Safety First)
1. **Search & Confirm**: Run a final project-wide grep for imports from target directories.
2. **Phase 1 (Routes)**: Remove `app/` routes (e.g., `/mining`).
3. **Phase 2 (Features)**: Remove `src/features/` directories after verifying no imports.
4. **Phase 3 (Lib)**: Consolidate utility files.
5. **Phase 4 (Verify)**: Run `pnpm build` to ensure no broken references.

---
**Status**: Plan Only (Awaiting User Signal to Proceed)
