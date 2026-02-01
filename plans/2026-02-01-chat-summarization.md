# Plan: Chat Session Title Summarization

## Objective
Implement a feature that automatically generates a concise, descriptive title for a chat session based on its content (usually triggered after the first message).

## Domain Changes
- **`ChatSession`**: Add a `title` field (string, optional).
- **`src/lib/validation.ts`**: Update `ChatSessionSchema` to include `title`.

## Persistence Changes
- **`src/features/chat/chat-repo.ts`**:
    - Update `getSession` to return the `title`.
    - Update `createSession` to initialize `title`.
    - Add `updateSessionTitle(sessionId, title)` method.

## Logic Changes
- **`src/features/chat/advanced-chatbot.ts`**:
    - Add `summarizeSessionTitle(messages: ChatMessage[]): Promise<string>` using LLM.
    - Trigger summarization in `sendMessage` if the session has only 1 message (the current one).
- **`src/features/chat/actions.ts`**:
    - Export `summarizeTitleAction(sessionId: string)`.

## UI Changes
- **`src/app/demo-v2/chat/page.tsx`**:
    - Display the session title in the sidebar.
    - Show a loading state or default title while summarization is in progress.

## Documentation Changes
- Update `docs/uncertain/class-diagram/chatbot.md` to include the `title` field and `summarize` logic.
- Update `docs/project-changelog.md`.

## Critical Invariants
- Summarization should NOT block the main chat response.
- If summarization fails, a fallback title (e.g., "New Chat") must be used.
- Titles should be capped at a reasonable length (e.g., 40 characters).

## Skill Reference
- `nextjs-best-practices`
- `ui-ux-pro-max`
- `typescript-expert`
