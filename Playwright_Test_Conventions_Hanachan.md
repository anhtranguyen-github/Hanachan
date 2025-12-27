# 🚨 Agent‑Enforceable Playwright Rules — Hanachan V2

> **Status**: STRICT · NON‑NEGOTIABLE  
> **Audience**: Coder Agents, Automation Agents, Refactor Agents  
> **Purpose**: Prevent flaky E2E tests, architectural drift, and Supabase hydration bugs.

---

## 0. Enforcement Level

- **MUST** = mandatory, violations are bugs  
- **FORBIDDEN** = never allowed under any circumstance  
- **SHOULD** = strong recommendation, deviation requires justification  

Agents must **refuse** to generate code that violates a MUST or FORBIDDEN rule.

---

## 1. Playwright Core Rules

### RULE 1.1 — Playwright Imports (MUST)

```ts
import { test, expect } from '@playwright/test';
```

❌ **FORBIDDEN**
- Importing `expect` from anywhere else
- `@jest/globals`
- Re‑exporting `expect`
- Wrapping `expect` in helpers (`assertVisible`, `checkVisible`, etc.)

> Reason: Causes `(0, utils.expect) is not a function` runtime failures.

---

### RULE 1.2 — Time‑Based Waiting (FORBIDDEN)

❌ **FORBIDDEN**
```ts
page.waitForTimeout(1000);
setTimeout(...);
sleep(...);
```

✅ **MUST USE**
```ts
await expect(locator).toBeVisible();
await page.waitForSelector('[data-testid="page-ready"]');
```

> If a timeout is needed, the **application is missing a state signal**.

---

## 2. Authentication (Supabase)

### RULE 2.1 — No UI Login in Tests (FORBIDDEN)

❌ **FORBIDDEN**
- Filling email/password inputs
- Clicking Supabase Auth UI buttons
- Waiting for Supabase login pages

> UI login tests Supabase, not Hanachan.

---

### RULE 2.2 — API‑Based Auth Injection (MUST)

Agents **MUST** authenticate via Supabase API and inject session state.

**Required Steps**
1. `supabase.auth.signInWithPassword()`
2. Inject session into:
   - `localStorage`
   - Cookies

❌ **FORBIDDEN**
- Hardcoding Supabase storage keys
- Guessing project ref strings

✅ **MUST**
Resolve key dynamically from Supabase project metadata or URL.

---

## 3. Hydration & App Router Synchronization

### RULE 3.1 — Ready Marker Pattern (MUST)

Every interactive page **MUST** expose a readiness signal.

```tsx
if (!isAuthResolved) return <Loading data-testid="auth-loading" />;

return <div data-testid="analyzer-ready" />;
```

❌ **FORBIDDEN**
- Interacting with UI before ready marker appears
- Assuming `page.goto()` means page is usable

---

### RULE 3.2 — Redirect Safety (MUST)

❌ **FORBIDDEN**
```tsx
if (!user) redirect('/login');
```

✅ **REQUIRED**
```tsx
if (!isAuthResolved) return <Loading />;
if (!user) redirect('/login');
```

> Prevents race conditions where user is temporarily null.

---

## 4. Global Overlays & Loaders

### RULE 4.1 — Overlay Test Safety (MUST)

All global overlays **MUST**:
- Use `data-testid`
- Disable pointer blocking when visually hidden

```tsx
<div
  data-testid="global-loading"
  className="pointer-events-none"
/>
```

❌ **FORBIDDEN**
- Invisible overlays with active pointer events
- Z‑index blockers without test hooks

---

## 5. Locator Strategy

### RULE 5.1 — data-testid First (MUST)

Critical elements **MUST** have `data-testid`.

| Element Type | Required |
|-------------|----------|
| Page Ready  | ✅ |
| Inputs      | ✅ |
| Buttons     | ✅ |
| Result Containers | ✅ |

---

### RULE 5.2 — Text Selectors (SHOULD)

Allowed only for:
- User‑visible copy assertions
- Non‑critical UI text

❌ **FORBIDDEN**
- Using text selectors for app state synchronization

---

## 6. Test Utilities

### RULE 6.1 — utils.ts Restrictions (MUST)

`utils.ts` **MAY**:
- Capture screenshots
- Attach DOM snapshots
- Add logging hooks

`utils.ts` **MUST NOT**:
- Export `expect`
- Wrap assertions
- Abstract Playwright matchers

---

## 7. Architecture Boundary Rules (CRITICAL)

### RULE 7.1 — Persistence Boundary

❌ **FORBIDDEN**
- Importing `db.ts` in:
  - UI components
  - API routes
  - Tests

✅ **MUST**
- Tests call **UI**
- UI calls **service.ts**
- `service.ts` calls `db.ts`

---

### RULE 7.2 — Validation Location

❌ **FORBIDDEN**
- Zod `parse()` inside `db.ts`

✅ **MUST**
- Validation in `service.ts` only

---

## 8. Failure Handling

### RULE 8.1 — On Failure (MUST)

Agents **MUST**:
- Preserve Playwright trace
- Preserve screenshot
- Preserve DOM snapshot

❌ **FORBIDDEN**
- Swallowing errors
- Retrying without diagnosing state failure

---

## 9. Absolute Anti‑Patterns

🚫 Any of the following is an **automatic rejection**:

- Re‑exporting `expect`
- Using `waitForTimeout`
- UI login flows
- Redirecting before auth resolution
- Tests calling `db.ts`
- Hardcoded Supabase keys
- Invisible pointer‑blocking overlays

---

---

## 10. Chat & Streaming UI Patterns (MUST)

### RULE 10.1 — Signal‑First Synchronization

In Chat or Streaming UIs, elements like `bot-message` are often rendered only after the backend starts responding. Tests must synchronize with the lifecycle of the chat session.

❌ **FORBIDDEN**
- Waiting for `bot-message` immediately after clicking `send-button`.
- Assuming the first message in the list is the bot's response without a state signal.
- Testing AI text content for logic verification (AI is nondeterministic).

✅ **MUST**
1. **Wait for Start**: Wait for `data-testid="bot-typing"` once send is clicked.
2. **Wait for Idle**: Wait for `data-testid="chat-idle"` before asserting on the final state.
3. **Action-Driven**: Assert on UI state tokens like `data-testid="bot-actions"` or specific buttons (`chat-analyze-action`, etc.) rather than the last bot message text.

> Reason: Chat UI is event-driven. Waiting for "Idle" ensures the stream has closed and the UI has committed all markers/buttons.

---

## Final Agent Directive

> **If a test is flaky, the application is wrong — not the test.**

Agents must:
- Demand state signals (like `chat-idle`)
- Refuse timing hacks
- Enforce boundaries strictly
- Prioritize action-driven testing over text-driven testing for AI features.


