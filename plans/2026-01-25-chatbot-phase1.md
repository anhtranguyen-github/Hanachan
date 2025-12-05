
# Implementation Plan: AI Tutor (Chatbot) Phase 1

## Objective
Implement core Chatbot logic focusing on Domain Knowledge (User Project Awareness) and Learning Support, temporarily using Local Storage for session persistence to bypass DB blockers.

## Phase 1: Local Context & Persistence (Headless)
- [ ] Create `src/features/chat/local-db.ts`: Map `sessionId` -> `ChatHistory[]`.
- [ ] Implement `LocalChatService` that mimics `ChatService` but persists to `data/chat_sessions.json`.
- [ ] Add `ProjectAwareness` module: Manually inject "User Project" context (e.g., "User is building Hanachan v2").

## Phase 2: Core Domain Logic (The Brain)
- [ ] **UC-05.1 Basic Use**: Standard Q&A with Persona (Hana-chan).
- [ ] **UC-05.2 Project Awareness**: Inject "You are coding Hanachan" context into system prompt.
- [ ] **UC-05.6 SRS Simulator**:
    - Trigger: "Quiz me" or "Review time".
    - Logic: Fetch due cards (mocked locally for now) -> Present 1 by 1 -> Grade response -> Update local SRS state.

## Phase 3: Validation Script
- [ ] `scripts/test-chatbot.ts`:
    - Simulates a conversation loop.
    - Test Case 1: "Hello Hana, who are you?"
    - Test Case 2: "What am I building?" (Project Awareness).
    - Test Case 3: "Quiz me on the word 'Sakura'." (SRS Simulator).

## Phase 4: Execution
1. Implement `LocalChatRepo`.
2. Enhance `ChatService` to accept `ContextInjectors`.
3. Create `ProjectAwarenessInjector`.
4. Run validation script.
