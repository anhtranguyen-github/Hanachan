# Architecture Report

> Generated 2026-03-19. Reflects the post-restructure `src/` layout.

---

## System Overview

Hanchan is a Japanese language learning platform with an AI tutor. It runs as three networked services plus two data stores:

```
┌──────────────────────────────────────────────────────┐
│              Next.js  (port 43100)                   │
│  App Router │ Server Actions │ BFF API routes        │
│  Features: learning, chat, reading, decks, video,    │
│            speaking, sentence, knowledge, analytics   │
└────────────────────┬─────────────────────────────────┘
                     │  HTTP (Bearer JWT)
                     ▼
┌──────────────────────────────────────────────────────┐
│              FastAPI  (port 43110)                    │
│  Tutor Agent (LangGraph) │ MCP tools │ Memory svc    │
│  Domains: learning, reading, chat                    │
└──────┬─────────────┬─────────────────┬───────────────┘
       │             │                 │
       ▼             ▼                 ▼
   Supabase       Qdrant           Neo4j
   (Postgres)     (Episodic)       (Semantic KG)
   Port 54421     Port 6333        Port 7687
```

### Responsibility split

| Layer | Owns |
|-------|------|
| **Next.js** | Auth (Supabase SSR), UI, FSRS scheduling, lesson/review session orchestration, curriculum progression, content loading |
| **FastAPI** | AI agent graph, MCP tool execution, episodic + semantic memory, LLM routing |
| **Supabase** | User data, learning state, content units, RLS enforcement |
| **Qdrant** | Episodic memory vectors (conversation summaries) |
| **Neo4j** | Semantic knowledge graph (extracted facts) |

---

## Frontend (src/nextjs)

### Feature modules

Each feature under `src/features/` is self-contained with actions, services, types, and hooks:

| Feature | Purpose |
|---------|---------|
| **auth** | Supabase auth, profile provisioning |
| **learning** | FSRS reviews, lesson batches, progress — split into `service.ts` (backend calls) and `data.ts` (local queries) |
| **chat** | Tutor interaction, message history |
| **reading** | Reading comprehension exercises |
| **video** | Video dictation practice |
| **speaking** | Voice recording/synthesis |
| **sentence** | Sentence mining, contextual examples |
| **decks** | Custom deck management |
| **knowledge** | Content metadata, lesson logic |
| **levels** | Curriculum level progression |
| **analytics** | Learning metrics |
| **admin** | Admin control plane |
| **jobs** | Background job scheduling |

### Service layer (`src/services/`)

| Service | Role |
|---------|------|
| **coreClient.ts** | Typed HTTP client for FastAPI learning/reading/deck endpoints |
| **agentsClient.ts** | Typed HTTP client for FastAPI tutor agent |
| **llmClient.ts** | LLM connection (OpenAI / Omniroute) for transcription + chat |
| **serverApiClient.ts** | Base class for server-side authenticated fetch |
| **apiClient.ts** | Base class for browser-side fetch |
| **chatClient.ts / userClient.ts / videoClient.ts / speakingClient.ts / sentenceClient.ts** | Domain-specific API helpers |

### BFF API routes (`src/app/api/`)

Routes at `/api/*` act as a Backend-for-Frontend layer: `/api/agent/`, `/api/chat/`, `/api/dictation/`, `/api/fsrs/`, `/api/memory/`, `/api/practice/`, `/api/speech-token/`, `/api/thread/`, `/api/videos/`.

---

## Backend (src/fastapi)

### Layer structure

```
app/
├── api/v1/endpoints/   # HTTP routes
├── agents/tutor_agent/ # LangGraph state machine
├── mcp/                # MCP tool definitions
├── domain/             # chat, learning, reading models
├── repositories/       # Supabase data access
├── services/memory/    # episodic, semantic, session, consolidation
├── core/               # config, LLM factory, auth, errors, logging
└── auth/               # JWT verification via Supabase JWKS
```

### Tutor agent graph

```
START → input_guard → router → [memory|fsrs|sql|direct]
                                      ↓
                               decision (loop ≤5, timeout 50s)
                                      ↓
                               response → output_guard → post_update → END
```

Nodes: `input_guard` (PII filter), `router` (LLM intent), `memory_node` (Qdrant+Neo4j retrieval), `fsrs_node` (learning tools), `sql_node` (safe read-only SQL), `response_node` (final generation), `post_update` (persist chat + extract memories), `output_guard` (PII redaction), `human_gate` (approval interrupt).

### MCP tool categories

Profile, Homework, Learning (progress/search/reviews/notes), Reading, Deck CRUD, Chat session, Database (schema introspection + read-only SQL).

---

## Data schema (key tables)

| Domain | Tables |
|--------|--------|
| **Content** | `knowledge_units`, `radical_details`, `kanji_details`, `vocabulary_details`, `grammar_details` |
| **Learning** | `user_learning_states` (FSRS: stability, difficulty, stage, next_review), `user_learning_logs` |
| **Sessions** | `lesson_batches` + `lesson_items`, `review_sessions` + `review_session_items` |
| **Chat** | `chat_sessions`, `chat_messages` |
| **Users** | `users` (level 1-60, display_name) |

---

## Auth flow

1. User logs in → Supabase issues JWT stored in httpOnly cookie
2. Next.js middleware refreshes session on every request
3. Server actions / API routes extract JWT from session
4. Calls to FastAPI include `Authorization: Bearer <JWT>`
5. FastAPI verifies JWT via Supabase JWKS, extracts `user_id`

---

## Infrastructure

Docker Compose runs: **nextjs** (43100), **fastapi** (43110), **qdrant** (6333), **neo4j** (7474/7687), **registry** (43130). Supabase runs separately via `supabase start` (ports 54421–54423).

---

## Architecture guard

`scripts/architecture-guard.py` enforces 9 rules via static analysis:

- No direct DB drivers (psycopg2/asyncpg) in FastAPI
- No JWT validation in FastAPI (auth through Next.js)
- No FSRS business logic in FastAPI
- No hardcoded FastAPI URLs in Next.js
- No in-memory state in FastAPI
- No CRUD service classes in FastAPI

---

## Current violations (pre-existing)

| Rule | File | Issue |
|------|------|-------|
| FORBIDDEN_JWT_VALIDATION | `app/auth/jwt.py` | FastAPI verifies JWT — needed for agent auth but conflicts with "auth through Next.js" rule |
| FORBIDDEN_DB_DRIVER | `app/agents/tutor_agent/merged_tools.py` | Direct asyncpg import |
| DIRECT_FASTAPI_CALL | `nextjs/tests/api/setup.ts` | Hardcoded localhost URL in test setup |
| BUSINESS_LOGIC_IN_FASTAPI | `app/domain/learning/services.py` | FSRS engine in backend |
