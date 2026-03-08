# Red Flag Questions (Detection of Weak Understanding)

## 1. The "Stateless" Contradiction
- **Question**: "You've successfully implemented a 100% stateless FastAPI agent host that NEVER touches the main database directly. How does your `SQLNode` query the user's decks and mastery levels in Supabase without a DB connection?"
- **Why it matters**: Detection of whether the candidate actually *read* the code in `merged_tools.py` or just parroted the architecture notes in `api.py`.
- **Red Flag**: "I don't know, it must be using a cache" or "It uses the Neo4j graph for that." (Actual answer: It uses a Supabase RPC via the `supabase` client).

## 2. Insecure SQL Regex Failure
- **Question**: "The `_is_safe_sql` regex in `merged_tools.py` prevents all SQL injection by blocking words like `UPDATE` and `DELETE`. Why is this more secure than using parameterized queries with a DB driver?"
- **Why it matters**: Identifying a fundamental lack of security knowledge. Regex blocklists are **never** more secure than parameterization.
- **Red Flag**: "Yes, because it stops the query before it even reaches the database." (Actual answer: It's NOT more secure; it's a fallback and can be bypassed).

## 3. Global Driver Lifecycle
- **Question**: "Since you're using a global `_driver` and `_client` for Neo4j and Qdrant, what happens to the database connections when the FastAPI server shuts down during a deployment? How are they closed gracefully?"
- **Why it matters**: Detecting lack of awareness of resource leaks and the `lifespan` handler.
- **Red Flag**: "They close automatically when the process exits" or "Python's garbage collector handles it." (Actual answer: There is NO explicit `driver.close()` call in the `lifespan` cleanup block in `main.py`).

## 4. LangGraph Sync Node Blocking
- **Question**: "If 1,000 users call the `/chat/stream` endpoint at the same time, and each agent run takes 10 seconds (spent mostly in the `response_node` LLM call), will the FastAPI server be able to handle all of them concurrently, or will it wait for each one to finish?"
- **Why it matters**: Testing understanding of event loop blocking and thread pool exhaustion.
- **Red Flag**: "It's async, so it handles them all effortlessly." (Actual answer: Sync nodes use a thread pool. If the pool is empty (default ~40 threads), the 41st user will be blocked).
