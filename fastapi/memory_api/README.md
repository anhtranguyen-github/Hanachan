# Memory Modules API

FastAPI backend implementing a **three-layer memory stack** for AI chatbot integration.

| Layer | Technology | Purpose |
|---|---|---|
| Session (Working Memory) | In-process dict | Active thread context, auto-titled, rolling summary |
| Episodic Memory | Qdrant (cloud) | Past conversation summaries, recalled by similarity |
| Semantic Memory | Neo4j (cloud) | User knowledge graph (entities, facts, relationships) |
| LLM | OpenAI GPT-4o | Generation, KG extraction, title & summary generation |
| Embeddings | OpenAI text-embedding-3-small | Vector embeddings for Qdrant |
| Orchestration | LangGraph | Retrieve → Generate → Update workflow |

## Setup

```bash
cd services/memory_api
uv sync
uv run uvicorn main:app --reload --port 8765
```

Reads credentials from `services/.env` automatically.  
Swagger UI: `http://localhost:8765/docs`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service + DB health |
| **Session** | | |
| POST | `/memory/session` | Create new thread → returns `session_id` |
| GET | `/memory/session/{session_id}` | Full thread info (messages, title, summary) |
| GET | `/memory/sessions/{user_id}` | List all active threads for user |
| PATCH | `/memory/session/{session_id}` | Update title / metadata |
| DELETE | `/memory/session/{session_id}` | End thread (optionally consolidate into long-term) |
| **Chat** | | |
| POST | `/memory/chat` | Memory-augmented chat (thread + episodic + semantic) |
| POST | `/memory/chat/stream` | SSE streaming version of chat |
| **Context** | | |
| POST | `/memory/context` | **Chatbot integration** — returns system prompt block |
| **Episodic** | | |
| POST | `/memory/episodic/search` | Similarity search in Qdrant |
| POST | `/memory/episodic/add` | Manually add memory |
| DELETE | `/memory/episodic/{memory_id}` | Forget a specific memory |
| DELETE | `/memory/episodic/clear` | Clear all episodic for user |
| **Semantic** | | |
| POST | `/memory/semantic/search` | Keyword search in Neo4j graph |
| POST | `/memory/semantic/add` | Manually add nodes/relationships |
| DELETE | `/memory/semantic/clear` | Clear semantic graph for user |
| **Profile** | | |
| GET | `/memory/profile/{user_id}` | Structured user profile from semantic graph |
| **Maintenance** | | |
| POST | `/memory/consolidate/{user_id}` | Merge old episodic memories (anti-bloat) |
| GET | `/memory/inspect/{user_id}` | Full snapshot: episodic + semantic + sessions |
| DELETE | `/memory/clear/{user_id}` | Nuke all memory for user |

## Chatbot Integration

### Option A — Full agent (session-aware)
```python
# 1. Create (or reuse) a session for the conversation thread
session = requests.post("/memory/session", json={"user_id": "alice"}).json()
session_id = session["session_id"]

# 2. Chat — the agent handles all three memory layers automatically
resp = requests.post("/memory/chat", json={
    "user_id": "alice",
    "message": "What stocks should I buy?",
    "session_id": session_id,
}).json()

print(resp["response"])
# Thread title is auto-generated after the first exchange:
# GET /memory/session/{session_id} → {"title": "Stock Investment Advice", ...}

# 3. End thread (flush to long-term memory)
requests.delete(f"/memory/session/{session_id}")
```

### Option B — Context injection (bring your own LLM)
```python
ctx = requests.post("/memory/context", json={
    "user_id": "alice",
    "query": "investment advice",
    "session_id": session_id,        # optional, includes thread history
}).json()

# Prepend to your system message
system_prompt = ctx["system_prompt_block"] + "\n\n" + YOUR_BASE_SYSTEM_PROMPT
# Then call your own LLM normally
```

## Architecture

```
Chat Request
     │
     ▼
┌─────────────────────────────────────────────────────┐
│                  LangGraph Agent                    │
│  ┌─────────────┐  ┌────────────┐  ┌─────────────┐  │
│  │   retrieve  │→ │  generate  │→ │   update    │  │
│  │   memory    │  │  response  │  │   memory    │  │
│  └──────┬──────┘  └──────┬─────┘  └──────┬──────┘  │
│    ┌────▼───────────┐    │          ┌─────▼──────┐  │
│    │ Thread context │    │          │  Qdrant    │  │
│    │ (session msgs) │    │          │  upsert    │  │
│    ├────────────────┤    │          ├────────────┤  │
│    │ Episodic search│  GPT-4o      │  Neo4j     │  │
│    │ (Qdrant)       │  stream      │  merge     │  │
│    ├────────────────┤    │          ├────────────┤  │
│    │ Semantic search│    │          │  Session   │  │
│    │ (Neo4j)        │    │          │  title+    │  │
│    └────────────────┘    │          │  summary   │  │
└──────────────────────────┼──────────┴────────────┘  ┘
                           ▼
                      Chat Response
                  (+ thread_context,
                   episodic_context,
                   semantic_context)
```
