# Plan: E2E Playwright Implementation (Super-Dev Level)

## Objective
Implement a robust, production-grade E2E testing suite using Playwright to verify critical user journeys in Hanachan V2, ensuring "Reliable WOW" factor for all core business flows.

## Critical User Journeys (Happy Paths)
Based on `docs/businessflow/bussinessflow.md` and `docs/usecases/usecase.md`:

1.  **Authentication**: Secure login using pre-configured test worker accounts.
2.  **Learning Flow**: Start a lesson batch -> Navigate through items -> Complete Quiz -> Update Status.
3.  **Review Flow**: Start review session -> Answer questions -> FSRS update -> Dashboard update.
4.  **Content Browser**: Filter by level/type -> View details -> Ensure data integrity.
5.  **Chatbot Interaction**: Start session -> Ask a question -> Verify AI response and tool usage.

## Technical Architecture
- **Framework**: `@playwright/test` (TypeScript)
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium (Mobile & Desktop)
- **Environment**: Local dev server with live Supabase (Local) connection.
- **Reporting**: HTML Report + Console output.

## Implementation Steps

### 1. Setup & Configuration
- Install devDependencies: `@playwright/test`, `dotenv`.
- Initialize `playwright.config.ts`:
    - Configure webServer to auto-start `pnpm dev`.
    - Setup global timeouts (60s).
    - Configure parallel execution (single worker for DB safety).
- Create `tests/e2e` directory structure.

### 2. Authentication Helper
- Implement a global setup or a reusable login helper.
- Verify that navigating to `/dashboard` redirects to `/login` if unauthenticated.

### 3. Test Suite Implementation
- `tests/e2e/auth.spec.ts`: Login/Logout flows.
- `tests/e2e/learning.spec.ts`: The "Learn" journey.
- `tests/e2e/review.spec.ts`: The "Training" journey.
- `tests/e2e/content.spec.ts`: Library browsing and details.
- `tests/e2e/chatbot.spec.ts`: Immersion chatbot flow.

### 4. Continuous Integration Integration
- Add `test:e2e` script to `package.json`.

## Error Handling & Boundaries
- **Network Resilience**: Use Playwright's `networkidle` for dynamic Next.js loads.
- **DB State**: Tests will use `DEMO_USER_ID` or test worker IDs.
- **Cleanup**: Ensure test-generated data doesn't pollute the local DB (where possible, or use specific test IDs).

## Visual Evidence
- Use `browser_subagent` to verify the "Sakura" theme is correctly rendered during the audit phase.
