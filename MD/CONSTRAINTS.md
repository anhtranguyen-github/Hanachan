# SAKURA SYSTEM V2: MASTER PROJECT CONSTRAINTS

This document is the absolute source of truth for the Hanachan V2 project. All development MUST strictly follow these rules.

---

## 1. Architectural Integrity (The "Hidden" Layer)

### 1.1. Feature-Oriented Flat Structure
- **Location**: All business logic must reside in `src/features/{feature_name}`. 
- **Folder Exclusion**: ❌ Do NOT create `domain/`, `logic/`, or `infrastructure/` sub-folders within features.
- **Organization**: Use plain modules (e.g., `srs.ts`, `review.ts`) directly within the feature folder.
- **Testing**: 
  - Tests are REQUIRED and MUST be in a separate `/tests` or `/__tests__` directory.
  - ❌ Do NOT place tests next to source files.
  - ❌ Do NOT mix test code into production code.

### 1.2. Hybrid Logic (Sentence-centric + CKB-centric)
- **Grammar (MANDATORY Sentence-Centric)**: Grammar units MUST always be learned via `ku-sentence` (Cloze format).
- **Radical, Kanji, Vocab (Flexible Centric)**: These Knowledge Units (CKB) are the core units. For the 60 standard levels, they use Character-Meaning format.
- **Unified Rule**: Any new Flashcard/Study unit created should link back to its **Discovery Source** (Sentence) whenever possible/available (Mandatory for Grammar).

### 1.3. Standard 60 Levels Card Protocols
- **Vocab, Kanji, Radical**: Learning format is **"Character (Face) - Meaning"**.
- **Grammar**: Learning format is **"Sentence - Answer (Cloze)"**.

### 1.4. Unified Learning State (SRS)
- **Status Enum**: Use `new` | `learning` | `review` | `relearning` | `burned`. (Synchronized with `src/config/design.config.ts`).
- **Mapping**: Use `stageToLearningState` in `src/types/srs.ts`. Avoid using "mastered" or "mastery" in code; use `review` instead.

### 1.5. Infrastructure Adapters
- Never import `supabase` or `openai` directly into UI. Use feature services.
- Use `Adapter Pattern` for data mocking.

---

## 2. Visual Design System (The "Vibrant Sakura" Aesthetic)

### 2.1. UI/UX Hierarchy (CRITICAL)
- **Priority**: This document (`CONSTRAINTS.md`) and `src/config/design.config.ts` OVERRIDE generic suggestions.
- **Vibrant Density Rule**: Avoid "pale" UI by using **Vibrant Solids** (high saturation) for primary buttons, active states, and markers. 
- **Semantic Darks**: DO NOT default to Deep Cocoa. Each category uses its own **Deep Accent** (e.g., Deep Navy for Radicals, Deep Rose for Kanji) for icons and borders.
- **NO Pure Black (#000)**: Use **Sakura Ink (#1C1C1C)** for text only.
- **NO Glassmorphism**: Do not use `backdrop-blur` for primary UI (Cards, Sidebar). These MUST be Solid with **Vibrant Borders (2px)** to maintain sharpness. Glass is permitted ONLY for non-essential floating overlays (Toasts, Popovers).
- **Contrast over Shadows**: Use `2px border` (Vibrant Border) for depth instead of generic Tailwind shadows.

### 2.2. Interaction Rules
- **Hover Saturation (MANDATORY)**: Interactive elements should increase brightness OR saturation on hover, accompanied by `hover:-translate-y-0.5`.
- **Sidebar Persistence**: Use the category's `deepColor` for active sidebar indicator and scaled icons.
- **Focus States**: Use `vibrantSolid` for ring highlights to anchor the user's attention.

---

## 3. Tooling & Performance
- **PNPM**: Mandatory package manager.
- **Turbo**: Use `pnpm dlx turbo build` for checks.
- **Next/Image**: Mandatory for all media assets.

## 4. Implementation Protocol
1. **Research**: Check `design.config.ts` first.
2. **Dual-Audit**: Ensure the feature has both a CKB representation and a Sentence context.
3. **Audit**: Verify "No Black" and "No Glass" compliance.
