# Issues Fixed

This document tracks all issues addressed in the codebase refactoring.

## Issue Index

| Issue | Description | Files Modified |
|-------|-------------|----------------|
| #1 | CORS restricted to explicit origins (no wildcard + credentials) | `main.py`, `.env.example` |
| #2 | Database pool initialized at startup | `database.py`, `main.py` |
| #3 | Hardcoded credentials removed | `database.py` |
| #4 | Silent write failures - exceptions now propagate | `database.py` |
| #5 | LLM/Embedding timeout configuration | `llm.py`, `memory_agent.py`, `consolidation.py`, `episodic_memory.py`, `session_memory.py`, `user_profile.py` |
| #6 | Sync code in async handlers - use run_in_threadpool | `chat.py` |
| #7 | Rate limiting with SlowAPI | `rate_limit.py`, `main.py`, `chat.py` |
| #8 | user_id UUID validation | `chat.py`, `schemas/chat.py` |
| #9 | Neo4j explicit transactions | `semantic_memory.py` |
| #10 | Relationship type allowlist regex | `semantic_memory.py` |
| #11 | PostgreSQL advisory locks | `consolidation.py` |
| #13 | Parallel memory retrieval | `memory_agent.py` |
| #14 | Global unhandled exception handler | `errors.py`, `main.py` |
| #15 | Request body size limit (64KB) | `main.py`, `schemas/chat.py` |
| #16 | Hard startup failure if DB unavailable | `main.py` |
| #18 | Single OR query instead of N+1 loop | `semantic_memory.py` |
| #19 | Streaming timeouts | `chat.py` |
| #20 | Structured JSON logging + RequestIdMiddleware | `logging.py`, `main.py` |

## Detailed Fixes

### Issue #1 — CORS Security
- **Problem:** CORS allowed wildcard origins with credentials
- **Solution:** Restrict to explicit origins from settings

### Issue #2 — Database Pool
- **Problem:** No connection pooling, created per-request
- **Solution:** Use `psycopg2.ThreadedConnectionPool` initialized at startup

### Issue #5 — LLM Timeout
- **Problem:** No timeout on LLM calls could block workers
- **Solution:** Central `make_llm()` and `make_embedding_model()` factories with 25s/10s timeouts

### Issue #7 — Rate Limiting
- **Problem:** No rate limiting
- **Solution:** SlowAPI with per-IP limits (20/min) and trusted proxy support

### Issue #8 — User ID Validation
- **Problem:** user_id not validated as UUID
- **Solution:** Pydantic validator in `ChatRequest` schema

### Issue #11 — Advisory Locks
- **Problem:** Concurrent consolidation could duplicate work
- **Solution:** PostgreSQL advisory locks on user_id hash

### Issue #13 — Parallel Memory Retrieval
- **Problem:** Sequential memory retrieval (episodic + semantic + session)
- **Solution:** ThreadPoolExecutor for concurrent fetch

### Issue #14 — Exception Handling
- **Problem:** Raw exception strings leaked to clients
- **Solution:** Global handler returns opaque error_id, logs details

### Issue #15 — Body Size Limit
- **Problem:** No limit on request body size
- **Solution:** MaxBodySizeMiddleware (64KB limit)

### Issue #16 — Startup Validation
- **Problem:** App starts even if DB unavailable
- **Solution:** Hard `sys.exit(1)` if DB pool init fails

### Issue #20 — Structured Logging
- **Problem:** Plain text logs, no request correlation
- **Solution:** JSON formatter with request-ID middleware
