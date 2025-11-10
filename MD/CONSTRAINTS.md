# Hanachan Project - Development Constraints & Guidelines

This document serves as the mandatory "Rules of Engagement" for all development on the Hanachan v2 codebase. All agents and developers must strictly adhere to these architectural and design principles.

## 1. Core Architecture & Codebase Strategy
### 1.1. Modular Monolith
- All features must reside in `src/modules/{feature_name}`.
- Shared logic/components reside in `src/lib` or `src/components`.
- Domain logic (interfaces, algorithms) is strictly decoupled from Infrastructure (databases, APIs).

### 1.2. Repository Pattern (DIP)
- **Interfaces**: Define all data access in `{module}/domain/interfaces`.
- **Implementations**: Place concrete logic (SQLite, Supabase) in `{module}/infrastructure`.
- **Usage**: Always use the interface in Server Actions or Service layers. Never import a concrete repository directly into a UI component.

### 1.3. Unified Learning State (MANDATORY)
- **Enum**: `LearningStatus` ('locked', 'new', 'learning', 'review', 'mastered', 'burned').
- **Mapping**: Use `stageToLearningState` helper for SRS levels.
- **Naming**: Avoid generic terms like `ItemState`. Use `LearningStatus` consistently.

---

## 2. Design System & UI Delivery
### 2.1. Visual Design Foundations
- **Foundations**: Strictly use tokens from `src/config/design.config.ts`.
- **Flat & Solid Design**: Avoid all glassmorphism (`backdrop-blur`). Use solid backgrounds.
- **No Neo-Brutalism**: Avoid thick black borders or harsh, high-contrast shadows.
- **Color Palettes**: Avoid default Tailwind colors. Use custom hex/HSL values defined in the system (e.g., `#F2A7B1` for Sakura motifs).
- **Typography**: Focus on high-contrast heading hierarchies (font-black, uppercase, tracking-tighter).
- **Text Contrast (CRITICAL)**: Never use light colors (white, light gray, pale tints) for text on light backgrounds. All text, labels, and badges must use high-opacity, dark, or saturated colors (Shades/Deep Tones) to ensure 100% legibility on all displays.
- **Non-Black UI Rule (MANDATORY)**: Icons, borders, and component backgrounds MUST NOT use pure black (#000) or heavy ink colors. Use brand colors (e.g., Deep Cocoa `#4A3728` or Deep Rose `#5D2E37`) for dark elements. Pure Ink (#1C1C1C) is reserved ONLY for body text and primary headings.
- **Semantic Color Consistency**: Colors must be mapped to concepts and used consistently across all modules. If "Dictionary" is Green in one page, it must be Green everywhere. No two conceptual pillars can share the same color.
- **Global Icon Strategy**: Icons must NEVER be black. They must use their conceptual semantic color or a brand neutral (e.g., Deep Cocoa). Active navigation icons must be saturated and high-contrast against their background tint.
- **Highlight Consistency**: Hover states, active borders, and highlight rings must strictly follow the conceptual semantic color of the current context.
- **Shadow Limitation**: Avoid all shadows (generic or colored). Use subtle borders to create depth.
- **Sticky Headers (MANDATORY)**: Every page must have a `sticky top-0 z-50` header. The header must have a solid background (e.g., `bg-white` or `bg-sakura-bg-app`) to maintain visibility. No glass/blur.
- **Header Standardization Pattern**: All page headers must follow this structure: 
  * Left: `Large Black Title` (tracking-tighter) + `Uppercase Subtitle Pill`.
  * Right: `Action Slot` (Buttons, Filters, or Status Indicators).
  * Divider: A subtle bottom border (`border-b border-sakura-divider`).

### 2.2. Web Component Design
- **Navigation Highlights**: Sidebars and navigation bars must use high-visibility active states with saturated brand-colored icons and transparent background tints (e.g., Sakura Mist).
- **Atomic Components**: Build small, reusable components (e.g., `KUBadge`, `KUCard`).
- **Prop Consistency**: Components matching `LearningStatus` must have a `state` prop of that type.
- **Iconography**: Use `lucide-react` icons mapped within `design.config.ts`.
- **Button Hierarchy (MANDATORY)**: Use `SakuraButton` variants appropriately:
  * TIER 1 (Actions): `primary`, `success`, `danger` - High visual weight for CTAs
  * TIER 2 (Content Types): `radical`, `kanji`, `vocabulary`, `grammar` - Semantic colors matching content
  * TIER 3 (Utility): `secondary`, `ghost`, `outline`, `info`, `warning` - Low visual weight
- **Hover Effects (MANDATORY)**: All interactive elements must have visible hover states:
  * Buttons: `hover:-translate-y-0.5` lift effect + brightness increase
  * Sidebar items: Colored background matching active state at 60% opacity + left border accent
  * Cards: `hover:scale-105` or `hover:-translate-y-1` subtle lift
  * Links: Color change or underline on hover

### 2.3. Responsive Design
- **Mobile-First**: All layouts must be verified for 375px upward.
- **Sticky Headers**: Toolbars and headers should use `sticky top-0` for better accessibility.

---

## 3. Build & Performance Optimization
### 3.1. Turborepo & Caching
- **Build Command**: Always use `bun x turbo build`.
- **Caching**: Monitor `turbo.json` to ensure `.next` outputs are properly cached.
- **Package Manager**: Use `bun` exclusively. Do not use `npm` or `yarn`.

### 3.2. Performance
- Use `next/image` for media.
- Minimize third-party JS.
- Ensure all pages have a single `<h1>` for SEO.

---

## 4. Implementation Workflow (For AI Agents)
1. **Analyze existing logic**: View `design.config.ts` and `{module}/domain` before editing.
2. **Design First**: Update `design.config.ts` if a new content type or state is added.
3. **Draft UI**: Use relevant "Design Skills" (Visual Foundations, Tailwind Design System).
4. **Verify Build**: Always run `npm run build` (which triggers Turbo) to check for type errors and build compliance.

---

## 5. Explicit Tooling Instructions

### 5.1. How to use Turborepo
- **Cache Hits**: Turborepo caches tasks globally. If code hasn't changed, `turbo build` will finish in seconds.
- **Commands**:
    - Build: `bun x turbo build` (Checks all modules)
    - Dev: `turbo dev` (Parallelized dev server)
    - Lint: `turbo lint`
- **Maintenance**: Never delete `turbo.json`. If builds fail unexpectedly, clear cache with `rm -rf .turbo`.

### 5.2. UI Implementation Skills (The "Golden" Process)
When requested to build UI, follow these skills in order:
1.  **Visual Design Foundations**: Set the color palette and typography in `design.config.ts`.
2.  **Tailwind Design System**: Map these tokens to Utility Classes. Use HSL for dynamic color transparency.
3.  **Web Component Design**: Break the UI into functional blocks. Ensure components respond to `LearningStatus`.
4.  **Responsive Design**: Use grid-cols-1/2/4... and flex-col/row to ensure 100% responsiveness.

## 6. Current Codebase Signature
- **Target Path**: `src/`
- **Key Files**:
    - `src/config/design.config.ts`: The source of truth for aesthetics.
    - `src/types/srs.ts`: The source of truth for learning logic.
    - `src/modules/learning/actions.ts`: Core learning interface.
- **Linting**: No `any` types allowed (fix with explicit interfaces).
- **Styling**: Vanilla CSS is allowed for complex animations, but Tailwind is preferred for structural layout.
