# Project Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-01-24
### Refactored
- **Architecture**: Enforced "Clean-lite" structure across all `src/features/`.
  - Renamed `analysis` to `sentence`.
  - Standardized all features to use `db.ts`, `service.ts`, `types.ts`, `index.ts`.
  - Removed "antibattery" folders (`domain`, `infrastructure`, `hooks`).
- **Naming Convention**: Adopted "Descriptive Naming" (e.g., `schedule.ts` vs `fsrs.engine.ts`).

### Documentation
- **Consolidated**: Merged dispersed design docs into `USE_CASE_DETAIL.md` and `PACKAGE_STRUCTURE.md`.
- **Constitution**: Created `PROJECT_DNA.md` as the single source of truth for architectural rules.
- **Workflow**: Updated `dev-pro.md` to enforce strict "Critical Rules" and `error-handling-patterns`.

### Added
- Professional Development Skills in `.agents/skills/`:
  - `documentation-engine`: Automated doc updates.
  - `orchestration-expert`: Task flow management.
- Master Production Workflow in `.agents/workflows/dev-pro.md`.
