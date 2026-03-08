# Python Internals Questions

## 1. Thread Safety & Global Singletons
- **Question**: In `src/fastapi/app/services/memory/semantic_memory.py` and `episodic_memory.py`, you use global variables `_driver` and `_client` to store the database connections. Given that FastAPI handles requests concurrently (potentially using multiple threads if using sync dependencies or workers), how would you ensure this pattern remains thread-safe during high-load initialization? What are the risks of using the `global` keyword here compared to using a FastAPI dependency (`Depends`) or a singleton class with a proper `__new__` or `get_instance` method?
- **Why it matters**: Evaluates understanding of Python's memory model, thread safety in a web server context, and best practices for resource management.
- **Strong answer should include**:
    - Mention of the **Global Interpreter Lock (GIL)** and how it affects I/O-bound vs CPU-bound tasks.
    - Suggestion of using a **threading.Lock** or **asyncio.Lock** to prevent race conditions during the initial `None` check.
    - Comparison with **FastAPI Router Dependencies**, which can handle object lifecycle (setup/teardown) more cleanly.
    - Recognition that Neo4j and Qdrant drivers are typically thread-safe internally, but the *initialization* step in this code is not.

## 2. LangGraph State Merging with `Annotated`
- **Question**: In `src/fastapi/app/agents/tutor_agent/state.py`, the `messages` field in `TutorState` is defined as `Annotated[list[BaseMessage], _merge_lists]`. What is the specific purpose of this `Annotated` syntax in the context of LangGraph? If two parallel nodes in the graph both return `{"messages": [new_msg]}`, how does LangGraph handle the state update, and what would happen if you removed the `_merge_lists` function and just used `list[BaseMessage]`?
- **Why it matters**: Tests depth of knowledge in advanced Python typing and the specific execution model of LangGraph.
- **Strong answer should include**:
    - Explanation of the **Reducer** pattern: `Annotated` tells LangGraph how to "reduce" (accumulate) updates rather than overwrite them.
    - Default behavior (without reducer) is to overwrite the key in the state.
    - In parallel execution, the order of merging might matter; `_merge_lists` (simple concatenation) is order-dependent.

## 3. Sync vs Async Execution in Agent Nodes
- **Question**: Several nodes like `memory_node` in `src/fastapi/app/agents/tutor_agent/nodes/` are defined as synchronous functions (`def`), yet they are run within an asynchronous graph (`astream_events`). How does LangGraph handle the execution of these sync nodes without blocking the FastAPI event loop? What are the performance implications of making these nodes `async def` and using `await` for the DB calls instead?
- **Why it matters**: Evaluates understanding of `asyncio`, thread pools, and the trade-offs of blocking I/O in modern Python web frameworks.
- **Strong answer should include**:
    - Mention of `run_in_threadpool` or equivalent internal mechanisms (like `anyio.to_thread.run_sync`).
    - Explanation that sync nodes occupy a thread from the pool, while async nodes yield control back to the event loop.
    - Recognizing that for I/O-heavy nodes (DB, LLM), `async def` is generally preferred to maximize throughput and minimize thread overhead.
