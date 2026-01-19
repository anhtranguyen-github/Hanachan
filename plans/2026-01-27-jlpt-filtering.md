# Plan: Advanced JLPT & Level Filtering

## Objective
Implement a robust filtering system for Kanji, Vocabulary, and Grammar libraries that allows users to filter content by JLPT levels and their associated numeric ranges.

## Mapping Logic
| JLPT | Levels |
| :--- | :--- |
| **N5** | 1 - 10 |
| **N4** | 11 - 20 |
| **N3** | 21 - 35 |
| **N2** | 36 - 50 |
| **N1** | 51 - 60 |

## Target Pages
1. **Kanji**: `src/app/(main)/content/kanji/page.tsx`
2. **Vocabulary**: `src/app/(main)/content/vocabulary/page.tsx`
3. **Grammar**: `src/app/(main)/content/grammar/page.tsx`

## Implementation Steps

### Phase 1: Filter Logic & Component
1.  **Refactor `fetchLevelContent` usage**:
    - Instead of just fetching level 1, fetching the specific range associated with the selected JLPT level.
2.  **Filter UI**:
    - Create a "Quick Level Picker" (JLPT Chips) at the top of the libraries.
    - Implement a "Custom Level Range" slider or input for more granular control.

### Phase 2: Page Implementation
1.  **Kanji Library**:
    - Add state for `selectedJLPT` and `currentLevel`.
    - Update `useEffect` to fetch data based on the selection.
    - Implement a "Level Roadmap" feel - show which level within the JLPT range is currently being viewed.
2.  **Vocabulary & Grammar**:
    - Replicate the filtering logic.
    - Standardize the card layout to show the JLPT badge prominently.

### Phase 3: Premium UI Fixes
1.  **Claymorphism Chips**: Use rounded-clay buttons for JLPT selection.
2.  **Loading States**: Add a transition shimmer when switching JLPT levels.

## Skill Reference
- `ui-ux-pro-max`: For the filter interaction tokens.
- `nextjs-best-practices`: For efficient state updates.
- `frontend-design`: For the JLPT badge styling.
