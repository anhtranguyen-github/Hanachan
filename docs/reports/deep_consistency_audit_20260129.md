# Deep Consistency Audit Report: Documentation vs. Codebase
**Date**: 2026-01-29
**Status**: UP-TO-DATE (Post-Sprint Refactor)

This report details the alignment between architectural designs and the realized codebase following the FSRS logic update.

---

## 1. SSS/FSRS & Progress Logic
**Docs Analyzed**: `docs/fsrs/FSRS_LOGIC.md`, `docs/solution/srs_fsrs.md`, `docs/constitution/fsrs.md`
**Codebase Reference**: `src/features/learning/domain/FSRSEngine.ts`

### ✅ ALIGNED: SRS Timing (2.4h Initial Review)
- **Status**: The initial review interval after a lesson is confirmed at **~2.4 hours** (Stability 0.1). 
- **Consistency**: Both the implementation (`FSRSEngine.ts`) and documentation (`FSRS_LOGIC.md`) are synced at this value.

### ✅ FIXED: The "Burned" Filter Leak
- **Issue**: Burned items were reappearing in the queue.
- **Correction**: `learningRepository.fetchDueItems` now includes `.neq('state', 'burned')`.

### ⚠️ Inconsistency: Binary Rating Simplification
- **Status**: **RESOLVED VIA SIMPLIFICATION**.
- **Change**: The codebase intentionally uses a binary `pass/fail` derived from user accuracy. The document `FSRS_LOGIC.md` has been updated to acknowledge this "Implicit Rating" system.

---

## 2. Learning Flow & Session Management
**Docs Analyzed**: `docs/businessflow/bussinessflow.md`
**Codebase Reference**: `src/features/learning/domain/FSRSEngine.ts`

### ✅ FIXED: Initial "Foundation" Repetition
- **Issue**: The `reps === 2` check was being skipped for new items.
- **Correction**: Implementation now includes a stability guard:
    ```typescript
    if (reps === 2 && stability < 0.166) { stability = 0.166; }
    ```
    This ensures the 4-hour foundation mốc là mốc cố định đầu tiên sau khi học xong.

---

## 3. Data Schema & Architecture
**Docs Analyzed**: `docs/constitution/architecture-nextjs-practical.md`

### ✅ FIXED: Architectural Rule Violations
- **Issue**: `service.ts` was calling `supabase` directly for user level-up logic.
- **Correction**: Database calls moved to `auth/db.ts` domain.

### ✅ FIXED: "Smart Relearning" Strategy
- **New Strategy**: 
    1. `Reps = max(1, reps - 2)` (No more 0-reset).
    2. `Stability Fail = S * 0.4`.
    3. `Stability Success Guard`: New Stability is always $\ge$ Current Stability.

---

## Summary of Audit Findings
As of 2026-01-29, the **FSRS Core** is now fully synced between documentation and implementation. The system uses a 2.4-hour initial interval and a "Smart Relearning" approach.
