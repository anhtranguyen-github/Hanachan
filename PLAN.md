# Sakura V2 UI/UX Validation Plan

This plan outlines the End-to-End (E2E) testing strategy to ensure the Hanachan v2 frontend strictly adheres to the "Solid Sakura" design system.

## 1. Core Principles Audit
Goal: Automate the verification of the "Avoid" and "Follow" rules.

| Rule | Requirement | Test Method |
|------|-------------|-------------|
| **No Glass** | Zero `backdrop-filter: blur` on list items and page backgrounds. | Check CSS properties on specific selectors. |
| **No Pure Black** | No `#000000` or `black` in backgrounds, borders, or icons. | Assert computed styles for `color`, `background-color`, `border-color`. |
| **No Generic Shadows** | No `shadow-sm`, `shadow-md`, `shadow-lg` (Tailwind defaults). | Verify absence of standard shadow utility classes/styles. |
| **Solid Headers**| Headers must be `sticky` and have an opaque background. | Scroll and check visibility + `backgroundColor`. |
| **High Contrast** | Text on badges and buttons must be high-contrast and legible. | Computed style check on text color vs background. |

## 2. Navigation & Semantic Highlighting
Verify that the sidebar and navigation reflect the conceptual context of the page.

- **Sidebar Active States**:
    - Dashboard → Cyan border/bg.
    - Library/Decks → Rose border/bg.
    - Radicals/Kanji/Vocab/Grammar → Teal/Emerald/Blue/Amber.
    - Tools (YouTube/Analyzer/Chat) → Red/Violet/Indigo.
- **Header Synchronization**:
    - Subtitle pill colors must match the content category.
    - "Dictionary" view → Green accents.
    - "Grammar" view → Amber accents.

## 3. Component Interaction
- **SakuraButton Validation**:
    - Verify `border-b-4` physical depth effect.
    - Verify variant-specific colors (e.g., Radical button is teal).
    - Hover/Active states (slight scale or background shift).
- **ContentCard States**:
    - Status-based border colors (Indigo for Mastered, Gold for Burned).
    - No blur, even on locked items.
- **Global Word Modal**:
    - Ensure it appears with a high-opacity Scrim (Overlay).

## 4. Layout Verification
- **Mobile Responsiveness**: Verify sidebar collapses into a thin bar and headers adjust height (56px).
- **Command Center (Dashboard)**:
    - Bento grid rendering.
    - Presence of "Matrix Theme" card (Dark theme with contrasting icons).

## 5. Implementation Workflow
1. Create `tests/e2e/ui_visual_audit.spec.ts`.
2. Implement utility functions to check color tokens.
3. Define page traversal to audit all major routes.
4. Fail the test if any "Avoid" rule is violated.
