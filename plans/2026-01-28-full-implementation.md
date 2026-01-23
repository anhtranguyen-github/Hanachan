# Implementation Plan: Hanachan v2 Premium Core

**Date**: 2026-01-28
**Workflow**: Super-Dev-Pro

## 1. Objective
Build the ultimate Japanese learning platform with a high-stakes, "WOW" level interface and bulletproof FSRS logic.

## 2. Domain & Invariants
- **Knowledge Hierarchy**: Radicals (L1) -> Kanji (L2) -> Vocabulary (L3).
- **FSRS Constraint**: Items only promote to `review` grade if Stability >= 3 days.
- **Sequential Learning**: Users must finish Batch N before Batch N+1.
- **90% Knowledge Rule**: Level increment requires 90% of current level to be in `review` stage.

## 3. UI/UX Strategy (Premium)
- **Palette**: Sleek dark mode (Slate-950 background) with vibrant accents (Indigo-500, Rose-500).
- **Aesthetics**: Glassmorphism cards (`bg-white/10 backdrop-blur-md`), bold borders (`border-gray-200/20`).
- **Typography**: `Inter` for clarity, `Outfit` for headings.
- **Animations**: Framer Motion for slide-ins, scale effects on cards.

## 4. Implementation Steps

### Phase 1: Logic & Persistence (The Foundation)
1. **FSRSEngine**: Implement `src/features/learning/domain/FSRSEngine.ts` matching the logic in `FSRS_LOGIC.md`.
2. **Repositories**: Clean `src/features/*/db.ts` to strictly follow `final_schema.sql`.
   - `knowledgeRepository`: Rich fetching including cross-relations (Kanji components).
   - `learningRepository`: FSRS updates, batch management.
3. **Services**:
   - `LearningCoordinator`: Implements the "Sequential Batch" and "90% Rule".
   - `ReviewCoordinator`: Implements "Faceted Review" (Meaning/Reading).

### Phase 2: API & Components
1. **Server Actions**: Robust actions with Zod validation.
2. **Premium UI Components**:
   - `KnowledgeCard`: Glassmorphism detail card.
   - `SRSProgressIcon`: Visual stage indicator (New/Apprentice/Guru/Master/Burned).
   - `Heatmap`: GitHub-style activity grid.

### Phase 3: Integration
1. **Dashboard**: Live stats from Supabase.
2. **Session Interfaces**: Refactor Lesson and Review pages to use the new coordinators.
3. **AI Assistant**: Integrate with Supabase Vector (if available) or keyword-based context.

---

## 5. Clean-up & Migration
- Delete `src/features/mock-demo`.
- Update all imports to use live features.
- Reuse `src/app/(demo)/test-render` for visual auditing of components.
