# Refactor Plan

> Ordered steps to reach the target architecture. Each phase is independently shippable.

---

## Phase 1 — Naming & test hygiene ✅ COMPLETE

| # | Task | Status |
|---|------|--------|
| 1.1 | Rename `coreClient` → `backendClient` | ✅ Done — file, class, instance, 4 consumers, 2 test files, config |
| 1.2 | Split backend tests into `tests/unit/`, `tests/architecture/` | ✅ Done — 76 unit + 10 architecture tests |
| 1.3 | Update architecture guard messages | ✅ Done — reflects single-backend reality |
| 1.4 | Fix `DIRECT_FASTAPI_CALL` violation in `nextjs/tests/api/setup.ts` | ✅ Done — renamed to `BACKEND_API_URL` |

**Exit criteria met**: TypeScript typecheck clean. 76 frontend tests pass. 59 backend unit tests pass + 5 architecture tests pass (5 pre-existing architecture violations remain for Phase 2-4).

---

## Phase 2 — Remove backend auth duplication (medium risk)

| # | Task | Files | Effort |
|---|------|-------|--------|
| 2.1 | Add `x-user-id` header injection in Next.js `serverApiClient.ts` | 1 file | S |
| 2.2 | Create FastAPI middleware that reads `x-user-id` header + validates shared secret | `src/fastapi/app/core/` | S |
| 2.3 | Update MCP tool executor to use header-based user_id | `src/fastapi/app/agents/tutor_agent/nodes/_tool_executor.py` | S |
| 2.4 | Remove `app/auth/jwt.py` and all JWT verification code | `src/fastapi/app/auth/` | M |
| 2.5 | Update architecture guard: remove JWT rule, add `x-user-id` validation rule | `scripts/architecture-guard.py` | S |

**Exit criteria**: FastAPI has zero JWT imports. Agent chat works with header-based auth.

---

## Phase 3 — Consolidate FSRS to frontend (medium risk)

| # | Task | Files | Effort |
|---|------|-------|--------|
| 3.1 | Verify Next.js FSRS implementation covers all backend FSRS cases | Compare `features/learning/` vs `app/domain/learning/services.py` | M |
| 3.2 | Update MCP `submit_review` tool to call Next.js FSRS instead of backend FSRS | `src/fastapi/app/mcp/` | M |
| 3.3 | Remove `app/domain/learning/services.py` FSRS engine | Backend domain files | S |
| 3.4 | Remove `BUSINESS_LOGIC_IN_FASTAPI` guard violations | Verify clean scan | S |

**Exit criteria**: Single FSRS implementation in Next.js. Backend has no scheduling logic.

---

## Phase 4 — Eliminate backend CRUD (medium risk)

| # | Task | Files | Effort |
|---|------|-------|--------|
| 4.1 | Migrate `/learning/*` endpoints to Next.js server actions + direct Supabase | `src/fastapi/app/api/v1/endpoints/`, `src/nextjs/src/features/learning/` | L |
| 4.2 | Migrate `/reading/*` endpoints to Next.js server actions | Same pattern | M |
| 4.3 | Migrate `/decks/*` endpoints to Next.js server actions | Same pattern | M |
| 4.4 | Keep only `/agent/chat`, `/api/v1/health`, `/memory/*` in FastAPI | Delete unused endpoint files | M |
| 4.5 | Remove `app/domain/`, `app/repositories/` from FastAPI | Backend cleanup | S |

**Exit criteria**: FastAPI serves only agent + memory endpoints. All CRUD goes through Next.js → Supabase.

---

## Phase 5 — Contract-first API (low risk)

| # | Task | Files | Effort |
|---|------|-------|--------|
| 5.1 | Add OpenAPI spec export to FastAPI (`/openapi.json`) | Already built-in, verify schema | S |
| 5.2 | Add codegen script: `openapi-typescript-codegen` → `src/nextjs/src/services/generated/` | `package.json`, new script | M |
| 5.3 | Replace hand-typed `backendClient` methods with generated client | `src/nextjs/src/services/backendClient.ts` | M |
| 5.4 | Add CI check: generated client matches live OpenAPI spec | CI config | S |

**Exit criteria**: Changing a FastAPI endpoint breaks the frontend build unless the client is regenerated.

---

## Phase 6 — Feature boundary consistency (low risk)

| # | Task | Files | Effort |
|---|------|-------|--------|
| 6.1 | Apply `actions.ts` / `service.ts` / `data.ts` split to `reading` feature | `src/nextjs/src/features/reading/` | M |
| 6.2 | Apply same split to `decks` feature | `src/nextjs/src/features/decks/` | M |
| 6.3 | Apply same split to `chat` feature | `src/nextjs/src/features/chat/` | M |
| 6.4 | Remove asyncpg from `merged_tools.py`, use Supabase client | `src/fastapi/app/agents/tutor_agent/merged_tools.py` | S |

**Exit criteria**: All features follow the same layering pattern. Zero direct DB driver imports in FastAPI.

---

## Effort key

- **S** = small (< 1 hour)
- **M** = medium (1–4 hours)
- **L** = large (4+ hours)

## Recommended execution order

Phases 1 → 2 → 3 → 4 → 5 → 6. Each phase can be a single PR. Phase 1 is safe to do immediately. Phases 2–4 require careful testing with live services.
