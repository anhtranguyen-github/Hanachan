# Plan: Align Chatbot with Documentation (Agentic Content Focus)

## Objective
Update the Chatbot implementation (`SimpleAgent` and `AdvancedChatService`) to align with the revised documentation. The agent should no longer have access to user progress (SRS statistics) and should focus exclusively on content interactions (Search, Analysis, Explanation).

## Domain & Invariants
- **Privacy/Security**: The Chatbot must NOT call `fetchUserDashboardStats` or query `user_learning_states`.
- **Functionality**: Content-based features (Search, Analysis) must remain fully functional.
- **Independence**: The Chatbot remains a standalone feature that does not update SRS states.

## Tasks

### 1. Update `SimpleAgent` (`simple-agent.ts`)
- Remove `PROGRESS` intent.
- Remove `statsAction` and `fetchUserDashboardStats` logic.
- Update `SYSTEM_PROMPT` to remove progress tracking capability.
- Modify `mockLLMResponse` to remove the progress suggestion.

### 2. Update `AdvancedChatService` (`advanced-chatbot.ts`)
- Remove `SRSSimulatorInjector` from the system prompt construction.
- Update `extractContextActions` to remove drill/SRS related actions.
- Update `buildSystemContext` to remove `SRS_SESSION` and `STUDY_REQUEST` handling.
- Align `handleAnalysis` to focus on content without implying user progress tracking.

### 3. Update `Injectors` (`injectors.ts`)
- Remove `SRSSimulatorInjector` class.
- Update `PersonaInjector` or `ProjectAwarenessInjector` if they mention learning progress.

### 4. Update `ChatRouter` (`chat-router.ts`)
- Remove `SRS_SESSION` and `STUDY_REQUEST` intents.

### 5. Cleanup `Recommendation Engine` and `ChatRepo` (`recommendation-engine.ts`, `chat-repo.ts`)
- Remove unused `identifyTroubleItems` and `recommendTopics`.
- Remove `getSRSStates` from `ChatRepository`.

## Verification
- Run local build to ensure no broken imports.
- Verify `SimpleAgent` in a dummy test script.
