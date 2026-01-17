# Plan: Unified Quick View Modal

## Objective
Implement a high-premium, unified Quick View modal system across all immersion and content detail pages. This allows users to click on any Japanese token or identified grammar point to see detailed explanations without leaving their current context.

## Target Pages
1. **Sentence Detail**: `/content/sentences/[id]` (Tokens & Grammar)
2. **YouTube Player**: `/immersion/youtube/[id]` (Subtitles & Analysis)
3. **Sentence Analyzer**: `/immersion/analyzer` (Breakdown & Grammar)
4. **Chatbot**: `/immersion/chatbot` (Analysis CTAs)

## Architecture
- **Shared Component**: `src/components/shared/QuickViewModal.tsx`
- **Logic Layer**: Use existing `MockDB` methods to fetch KU and Grammar details.
- **State Management**: Each page will host the modal state, but the UI will be standardized.

## Detailed Steps
1. **Create `QuickViewModal` Component**:
    - Support two modes: `TOKEN` (Vocabulary/Kanji) and `GRAMMAR`.
    - Apply Claymorphism design (rounded-clay, shadow-clay, border-2).
    - Include "Add to Deck" CTA for vocabulary.
2. **Refactor Sentence Detail Page**:
    - Replace current breadcrumb/local display with the new modal.
3. **Refactor YouTube Player**:
    - Update both the subtitle clicks and the analysis panel clicks to use the modal.
4. **Refactor Sentence Analyzer**:
    - Standardize the existing local modals to use the unified component.
5. **Update Chatbot**:
    - Ensure the "Analysis" result chips trigger the modal.
6. **Polish**:
    - Add smooth animations (zoom-in/zoom-out).
    - Ensure responsive layout (modal takes full width on mobile).

## Error Handling
- Show "Information not found" if CKB lookup fails.
- Fallback to raw text if properties are missing.

## Premium UI Specs
- Backdrop blur (backdrop-blur-sm).
- Zoom-in entry (animate-in zoom-in-95).
- Interactive hover states for close button and CTAs.
