# Target Architecture

> Where the codebase should converge. Each item is a concrete change, not a vision statement.

---

## 1. Single source of auth truth

**Current**: FastAPI has its own JWT verification (`app/auth/jwt.py`) duplicating Supabase JWKS logic. Architecture guard flags this but it's needed for agent tool auth.

**Target**: FastAPI trusts the Next.js BFF layer. Agent requests arrive pre-authenticated with a validated `user_id` header set by Next.js middleware — no JWT parsing in FastAPI.

**Constraint**: MCP tools still need user identity. Pass `x-user-id` header from Next.js after it verifies the session, remove `app/auth/jwt.py` entirely.

---

## 2. No FSRS engine in backend

**Current**: `app/domain/learning/services.py` contains an FSRS engine. Next.js also has FSRS logic in `features/learning/`. Two copies of the same scheduling algorithm.

**Target**: FSRS lives exclusively in Next.js (`features/learning/`). FastAPI learning endpoints become thin Supabase proxies or are eliminated — Next.js talks to Supabase directly via RLS for learning state.

---

## 3. Backend = agent host only

**Current**: FastAPI has `domain/learning/`, `domain/reading/`, `domain/chat/`, repositories, and services beyond what the agent needs.

**Target**: FastAPI contains only:
- `agents/` — LangGraph tutor agent
- `mcp/` — MCP tool definitions (read-only Supabase, Qdrant, Neo4j)
- `services/memory/` — episodic + semantic memory
- `core/` — config, LLM factory, logging

Everything else (learning sessions, reading exercises, CRUD) is handled by Next.js server actions + Supabase directly.

---

## 4. ~~Rename coreClient → backendClient~~ ✅ DONE

**Current**: ~~`coreClient` is a legacy name from when there were two backends (core + agents). Now there's one backend.~~

**Completed**: Renamed to `backendClient` across all consumers. Single import path: `@/services/backendClient`.

---

## 5. Contract-first API boundary

**Current**: Frontend client methods are hand-typed. Backend endpoints can drift without the frontend knowing.

**Target**: FastAPI exports an OpenAPI spec (`/openapi.json`). A codegen step (`openapi-typescript-codegen` or similar) generates the TypeScript client. `backendClient` becomes a generated file, not hand-maintained.

---

## 6. Remove asyncpg from agent tools

**Current**: `merged_tools.py` imports asyncpg directly for the `execute_read_only_sql` MCP tool.

**Target**: Use the Supabase client's `.rpc()` or `.from_()` methods instead. No direct database drivers in the FastAPI layer.

---

## 7. Clean feature boundaries

**Current**: Some features have mixed concerns — actions call repositories directly, services contain local logic and backend calls.

**Target**: Every feature follows a consistent pattern:
```
feature/
├── actions.ts     # Server actions (compose data + service)
├── service.ts     # Backend HTTP calls only
├── data.ts        # Local Supabase queries only
├── types.ts       # Shared types
└── hooks/         # React hooks (client components)
```

The `learning` feature already follows this pattern. Extend to `reading`, `decks`, `chat`.

---

## 8. ~~Test strategy alignment~~ ✅ DONE

**Current**: ~~Backend tests mix unit tests, integration tests needing Supabase, and architecture violation checks. 27 tests fail without live Supabase.~~

**Completed**:
- **Unit tests** (`tests/unit/`): 76 tests, all mocked — no external dependencies
- **Architecture tests** (`tests/architecture/`): 10 tests, static analysis only
- Root `pnpm run test` runs both categories

---

## Diagram: target state

```
┌──────────────────────────────────────────────────────┐
│              Next.js  (port 3000)                    │
│  Auth (sole owner) │ FSRS (sole owner) │ All CRUD    │
│  Server actions talk directly to Supabase (RLS)      │
│  Only calls FastAPI for: agent chat                  │
└────────────────────┬─────────────────────────────────┘
                     │  POST /agent/chat (x-user-id header)
                     ▼
┌──────────────────────────────────────────────────────┐
│              FastAPI  (port 6100)                     │
│  Agent host only. No CRUD, no auth, no FSRS.         │
│  LangGraph agent → MCP tools → memory services       │
└──────┬─────────────┬─────────────────┬───────────────┘
       │             │                 │
       ▼             ▼                 ▼
   Supabase       Qdrant           Neo4j
   (read-only)    (episodic)       (semantic)
```
