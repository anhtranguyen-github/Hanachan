# Sakura System V2: Final Premium Technical Blueprint

This plan outlines the "Non-Black UI" overhaul, focusing on the Dual-Layer Color System, Performance Optimization, and standardized UX patterns across Hanachan v2.

---

## 1. Universal Foundations (The Core Rules)
*Strict adherence to `FOLLOW.md` and `AVOID.md` is required.*

### 1.1 Dual-Layer Color System
*   **Set A: Content Ink (Soul)**: Colors based on **Content Type**. Used only for the "Ink" (Kanji characters, primary titles).
    *   *Vocab*: Emerald (`#059669`) / *Grammar*: Amber (`#D97706`) / *Radical*: Teal (`#0D9488`).
*   **Set B: UI Shell (Shell)**: Colors based on **Learning Stage**. Used for "Frames" (Borders, Rings, Highlights).
    *   *New*: Action Blue / *Learning*: Action Cyan / *Mastered*: Indigo (`#4F46E5`) / *Burned*: Gold Inverted.
*   **Action Color**: Fixed **Sakura Cocoa** (`#4A3728`) for all primary interactive elements (Buttons, Link icons).
*   **Interaction Matrix**:
    *   **Buttons (Global):** Dùng **Sakura Cocoa** cho các hành động vận hành (Gửi, Tiếp tục).
    *   **Buttons (Contextual):** Dùng **Semantic Color** của nội dung (Thêm Vocab = Green).
    *   **Sidebar Highlight:** Màu Active của Icon/Pill PHẢI trùng với màu Semantic của trang đó (Analyzer = Violet).
    *   **Dashboard Charts:** Phải mapping màu 100% với Content Type. (Cột Vocab = Green).
    *   **Selection Highlight:** Token được chọn trong Analyzer và Border của Panel chi tiết phải "Sync" màu với nhau.

### 1.2 No-Shadow Depth Strategy
*   Remove generic Tailwind shadows.
*   **Card Depth**: `1px border` (Stage-colored) + `ring-1` (Inner depth glow, Stage-colored).
*   **Highlighting**: Level 2 rings (`ring-2`) triggered only on `hover`/`focus`.

### 1.3 Performance Policy
*   **Selective Blur**: `backdrop-blur` is restricted to Desktop Sticky Headers only.
*   **Mobile Variant**: 56px height, solid background (no blur), `will-change: transform`.
*   **No Filters**: Avoid `grayscale()` filters in scrolls; switch HEX colors directly based on stage status.

---

## 2. Global Component Redesign

### 2.1 Standardized Sakura Header
*   A single `SakuraHeader` component for all pages.
*   **Layout**: [L] Black Title + Semantic Pill | [R] Action Slot.
*   **Specs**: 80px (Desktop), 56px (Mobile), `z-50`, `sticky top-0`.

### 2.2 /analyzer (Pro Sentence Deconstructor)
*   **Density Audit**: Title size reduction to `text-2xl`. Layout optimized for split-view.
*   **Recent Bar**: "Ghim" (Pin) system for previous analyses.
*   **AI Breakdown**: 3-Card Bento grid for cultural nuance and examples.
*   **Word Detail Modals**: Functional `KUModal` that triggers when clicking words in the list.

### 2.3 /chat (Hana Assistant)
*   **Bubble Refresh**:
    *   User: `bg-sakura-cocoa` (Action color) with White text.
    *   AI: `bg-white` border with `sakura-ai` (Violet) accents.
*   **Lifecycle**: Action buttons trigger side-effects via global Modals/Toasts to preserve message scroll position.

### 2.4 /immersion?type=youtube
*   **Library UX**: Collapse "Add New" section. Redesign video cards with 1:1 or 4:3 high-density grids.
*   **Stage Indicators**: Use the Stage Color for progress bars and border-rings.

---

## 3. Demo Fidelity (Mock Layer)
*   Implement `MockRepository` layer to provide the "Content Matrix" (Diverse Stages x Types).
*   **Burned Treatment**: Unique Inverted Gold state for content cards to act as learning "Trophies".
*   **Locked Treatment**: Warm Gray colors + "Lock" icon for better visual clarity.

---

## 4. Visual Asset Integration (Premium Texture)
*   **Background Layering**: Use `sakura_mist_bg` for global app depth without GPU blur.
*   **Sticker Lifecycle**: Inject "Kawaii stickers" at specific lifecycle moments (Empty states, Milestone celebrations).
*   **Hard-Glass Headers**: Headers use `bg-white/90` with the `sakura_mist_bg` peering through for a premium textured look.

---

## 5. Implementation Steps
1.  **Token Synchronization**: Inject Content Ink and UI Shell tokens into `design.config.ts`.
2.  **Visual Foundation Overlay**: Implement the global background texture and standardized header.
3.  **Analyzer Panel Refactor**: Implement the "Pinned" history, Detail Modals, and "Peeking" character sticker.
4.  **Chat UI Polish**: Alignment of bubbles and Icon colors (No black icons).
5.  **Immersion Library Overhaul**: High-density grid with Stage-based UI Shells and Ocean Waves texture.
6.  **Progress & Browse Pages**: "Sakura Glass" style with Mastery Trophies and sticker companions.
7.  **Global "Shadow-to-Border" Sweep**: Final CSS refinement for depth consistency.
