# Project Changelog

## [2026-01-31]
### Logic
- **Path**: `src/features/learning/ReviewSessionController.ts`
- **Change**: Added `mode` support (`learn` | `review`) to distinguish between batch-based mastery and atomic SRS updates.
- **Reasoning**: Learning (Discovery) requires passing a full batch before initializing SRS, whereas Review updates SRS immediately per-item.

- **Path**: `src/features/learning/service.ts`
- **Change**: Added `initializeSRS` function to set initial SRS state for new items.
- **Reasoning**: Standardizing the "Entry" point into the SRS system with consistent parameters (Stability: 4h, Difficulty: 3.0).

- **Path**: `src/app/(main)/learn/session/page.tsx`
- **Change**: Updated to pass `mode: 'learn'` and trigger SRS initialization upon KU completion in quiz.
- **Reasoning**: Satisfies the business requirement that only "Mastered" items (those passing the quiz) enter the spaced repetition loop.

## [2026-02-01]
### Logic & UI
- **Path**: `src/features/chat/advanced-chatbot.ts`, `src/features/chat/chat-repo.ts`
- **Change**: Implemented automated chat title summarization using LLM (GPT-4o).
- **Reasoning**: Enhances UX by providing meaningful context in the sidebar for past conversations, replacing generic titles.
- **Path**: `src/lib/validation.ts`
- **Change**: Added `title` field to `ChatSessionSchema`.
- **Reasoning**: Enables persistence and systematic validation of chat metadata.
