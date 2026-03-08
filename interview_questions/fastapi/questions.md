# FastAPI & Backend Questions

## 1. MaxBodySizeMiddleware Security Risks
- **Question**: In `src/fastapi/app/main.py`, the `MaxBodySizeMiddleware` checks the `Content-Length` header to enforce a 64KB limit. Can a malicious client bypass this limit and send a 1GB body? If they use `Transfer-Encoding: chunked` instead, the `Content-Length` header is typically **missing**. How would you implement a robust body size limit in a MiddleWare that actually reads the stream in chunks and cuts off if it exceeds the limit, without loading the whole body into memory (which would also be a vulnerability)?
- **Why it matters**: Tests security and resource management knowledge in the context of web protocols.
- **Strong answer should include**:
    - Identifying that **chunked encoding** bypasses the `Content-Length` check.
    - Mentioning **Streaming the request body** (`request.stream()`) and counting the bytes while iterating.
    - Returning a `413 Request Entity Too Large` as soon as the limit is hit to prevent further processing.

## 2. Server-Sent Events (SSE) and Agent Performance
- **Question**: Your `chat_stream` endpoint uses `StreamingResponse` with an `event_stream` generator that iterates over `tutor_graph.astream_events`. What happens to the **LangGraph thread or task** if the client prematurely disconnects from the SSE stream? How does FastAPI handle the cancellation, and does it automatically propagate to the underlying LangChain/Neo4j/Qdrant calls to stop them immediately?
- **Why it matters**: Evaluates knowledge of the FastAPI/Starlette lifecycle and resource cleanup in long-running streaming tasks.
- **Strong answer should include**:
    - Explanation that FastAPI (Starlette under the hood) detects client disconnect and raises an `asyncio.CancelledError`.
    - Propagation: Only **async** functions using `await` on libraries that support cancellation (like `httpx` or `asyncpg`) will stop.
    - Warning about **sync nodes** (like `memory_node` and `response_node` using `invoke`): These will continue running in their thread pool until they finish or the server shuts down, potentially wasting LLM tokens and DB resources.

## 3. Rate Limiting Strategy
- **Question**: You're using `slowapi` for rate limiting. Currently, it's applied at the endpoint level. What are the downsides of this when a user's multi-step LangGraph agent run takes 30 seconds to finish? Should the rate limit be checked **before** starting the graph run, or **per-step** within the graph itself? How would you handle a "Burst" of requests from a single user where the first 5 requests are still processing while the 6th one is blocked?
- **Why it matters**: Evaluates understanding of request lifecycle and concurrency in rate-limiting policies.
- **Strong answer should include**:
    - Discussion on **token bucket** vs **fixed window** algorithms.
    - The distinction between **request-level** rate limits and **concurrency-level** limits (limiting the number of simultaneously running agents per user).
    - Implementing a per-user "active tasks" counter in Redis to prevent a single user from exhausting all server threads.
