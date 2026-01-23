# Plan: UI Redesign - "Sakura Minimal" - 2026-01-28

## Objective
Transition Hanachan v2 from a technical "Tokyo Dark" aesthetic to a "Sakura Minimal" theme. The new design focuses on a soft pink/pastel palette, flat UI elements, and maximum readability for long learning sessions.

## 1. Design Tokens (globals.css)
- **Background**: Soft off-white or very light pink tint (`#FFF9FA`).
- **Primary**: Soft Pastel Pink (`#FFB7C5`).
- **Secondary**: Pastel Peach or Mint (`#E2F0CB` / `#FFDAC1`).
- **Text**: Deep Charcoal (not pure black) for readability (`#2D3436`).
- **Accent**: Muted Rose (`#D6A2E8`).
- **Surface**: Pure White (`#FFFFFF`).
- **Border**: Very thin, subtle strokes (`#F0E0E3`).

## 2. Global Styling Strategy
- **Removal**: Delete all `@apply bg-black`, `backdrop-blur`, `shadow-[0_0_...px_rgba(...)]`, and glowing gradients.
- **Cards**: Flat white backgrounds with a subtle 1px border. No shadows or very minimal "soft" shadows.
- **Buttons**: Flat pastel colors with solid dark text. High contrast labels.
- **Typography**: Focus on clarity. Increased leading (line-height) for Japanese text.

## 3. Component Tasks
- **Sidebar**: Change from dark to light. Use pastel pink for active states.
- **Dashboard**: Remove progress bar glows. Use clear, solid colors for level tracking.
- **Library List**: Flat grid of white cards on a pastel background.
- **Detail Pages**: Remove all "Premium Header" dark cards. Replace with light, spacious layouts.
- **Review Session**: Focus on a white "Card" on a pastel background for distraction-free learning.

## 4. Constraint Checklist
- [ ] No Blur/Glassmorphism.
- [ ] No Glowing Typography.
- [ ] High Contrast (Contrast ratio > 4.5:1 for text).
- [ ] Flat Design (Minimal depth).

## 5. Execution Order
1. **Design System**: Update `src/app/globals.css`.
2. **Layout**: Update `src/app/(main)/layout.tsx` background.
3. **Core Shell**: Update `src/components/layout/Sidebar.tsx`.
4. **Main Pages**: Update Dashboard and Content List.
5. **Detail Pages**: Standardize Radical, Kanji, Vocab, Grammar to the new theme.
6. **Interaction**: Update Review Session UI.

---
**Status**: Plan Active
