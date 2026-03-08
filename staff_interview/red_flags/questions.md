# Staff Level: Red Flag Questions (Technical Integrity)

## 1. The "Stateless" Fallacy & SQL Injection
- **Question**: "You've successfully moved all Database logic to Supabase and claim the FastAPI backend is **stateless**. However, `SQLNode` executes **Raw SQL** on Supabase using a client that's passed the `user_id` in the tool's kwargs. If a user says 'DROP TABLE', your code calls `_is_safe_sql`. Why is this **regex-based safety check** fundamentally broken, and why is this **Stateless** claim technically a **Leak of Responsibility** back from the Data layer to the Logic layer?"
- **Why it matters**: Detection of whether the candidate understands the difference between **Application-level safety** and **Database-level isolation (RLS)**.
- **Red Flag**: "It's stateless because we don't hold a persistent pool member in memory." (Actual answer: It's NOT stateless; the *responsibility* for maintaining the state schema is just hidden in the tool-call prompts).

## 2. In-Memory Graph Merging vs Concurrent Writes
- **Question**: In `semantic_memory.py`, `add_semantic_facts` uses a `MERGE` query in a single transaction for each relationship. If two concurrent requests from the same user both try to add the same fact ("User - LIKES -> Sushi") because the graph retrieval didn't see it yet, what is the **Deadlock or Duplicate risk** in Neo4j? How would you implement a **Unique Constraint** or a **Stateful Guard** to prevent duplicate node creation during parallel graph runs?
- **Why it matters**: Tests deep understanding of database concurrency and transaction isolation.
- **Red Flag**: "Neo4j's `MERGE` is atomic, so it's always safe." (Actual answer: `MERGE` can still fail or create duplicates if **Unique Constraints** aren't explicitly created on `(id, user_id)` pairs).

## 3. LangGraph Traceability & SSE Overflow
- **Question**: "The `chat_stream` SSE endpoint yield events like `on_chat_model_stream` and `on_chain_end`. If the agent's internal graph has 20 nodes (memory, sql, decision, etc.), and each node produces 1KB of 'thought' metadata, a single chat request might produce **20KB+ of control plane data** over the SSE stream before the first answer token. Design a **Sampling or Pruning strategy** to avoid flooding the client's network buffer while still providing 'Deep Tracing' for debugging."
- **Why it matters**: Evaluates real-world observability vs. performance trade-offs in low-latency SSE applications.
- **Red Flag**: "SSE is text, so 20KB is negligible." (Actual answer: In high-concurrency mobile environments, large control-plane payloads increase **TTFT (Time To First Token)** perceived by the user).
