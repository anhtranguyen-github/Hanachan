# Staff Level: FastAPI & System Design

## 1. Concurrency, Threading, and Blocked LangGraph Nodes
- **Question**: Your LangGraph nodes in `src/fastapi/app/agents/advanced_tutor_agent/nodes/` are **sync** functions (`def`). FastAPI runs these in a **ThreadPoolExecutor** (approx. 40 threads) by default. If your agent's `response_node` (using `chain.invoke`) takes 10 seconds per user, what happens to the **41st concurrent user**? How would you redesign this to be **Non-Blocking** using `ainvoke` and `async def nodes`? Evaluate the risk of **Database Connection Starvation** in your `SQLNode` if it's run synchronously.
- **Why it matters**: Evaluates knowledge of Python's `asyncio` loop, thread pooling, and high-concurrency request handling.
- **Strong answer should include**:
    - Identifying the **Thread Pool Exhaustion** risk.
    - Mentioning **Asynchronous DB Drivers** (using `asyncpg` with Supabase/Postgres).
    - Suggesting **astream_events** with a purely async node-set (already partially implemented) to yield control back to the event loop during LLM/DB execution.

## 2. Multi-Tenant ACL & Data Isolation
- **Question**: We currently use **Payload Filtering** (`user_id` as a field) in Qdrant and Neo4j. In a multi-tenant enterprise deployment (e.g., separate schools using Hanachan), is this **Filtering-at-Query-Time** sufficient for data isolation? Design a **Multi-Level ACL System** that integrates **Supabase Row Level Security (RLS)** with **Qdrant Partitions** or **Separate Collections** to ensure a "Hard Isolation" boundary between tenants. How would you handle a **Cross-Tenant Admin** who needs to query "Average progress across all school A students" without compromising individual user privacy?
- **Why it matters**: Tests the ability to design secure, isolated systems at the architectural level.
- **Strong answer should include**:
    - **Soft vs Hard Isolation**: Filtering is soft; separate collections is hard.
    - **Supabase RLS**: Mention using the `JWT` role and `user_id` in the DB policies.
    - **Qdrant Namespaces**: Suggesting tenant-based namespaces to avoid "Top-k Spillage" between users.
    - **Differential Privacy**: Suggesting **Aggregation Layers** for admin queries.

## 3. Embedding Model Cold Starts & Warmup
- **Question**: In `src/fastapi/app/core/llm.py`, the `make_embedding_model` is a factory called on every request. If you're using a local model (like `all-MiniLM-L6-v2` via SentenceTransformers), this can lead to **Cold Start Latency** for the first query after a deployments. Design a **Lifespan Warmup Strategy** in `main.py` that "eagerly" loads the local models (or primes the cloud LLM connection) *before* the server starts accepting traffic. How would you handle a **Memory Leak** if the factory is incorrectly creating many duplicate model instances rather than reusing a singleton?
- **Why it matters**: Evaluates operational excellence, latency optimization, and resource management.
- **Strong answer should include**:
    - **Lifespan Hooks**: Using `app.state` to store a single instance of the model.
    - **Dummy Prediction**: Running one `embed_query` during startup to JIT-compile/cache the model.
    - **Memory Leaks**: Detection using `tracemalloc` and ensuring a **Singleton Pattern** or **Dependency Injection Container** is used.
