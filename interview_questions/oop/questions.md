# OOP Design Questions

## 1. Architectural Remediation & API Statelessness
- **Question**: The `src/fastapi/app/api/v1/api.py` specifies that FastAPI is now a **stateless agent host** and "NEVER touches the database directly". However, `src/fastapi/app/agents/tutor_agent/nodes/sql_node.py` specifically uses a tool, `execute_read_only_sql`, which performs a Supabase RPC call. In terms of **SOLID** principles (specifically **Single Responsibility** and **Interface Segregation**), evaluate this architectural design choice. Does it actually achieve the desired "stateless" goal, or does it just push the "state" into the RPC layer? How could we refactor this to truly isolate the SQL logic from the agent while still allowing the agent to "query" the domain information?
- **Why it matters**: Evaluates architectural thinking, understanding of abstraction layers, and the ability to spot contradictions in a design.
- **Strong answer should include**:
    - Mention of the **Mediator** or **Proxy** pattern: The agent is still coupled to the Supabase schema through its prompt and tool calls.
    - Identification of the **Violation of SRP**: The agent node is responsible for intent recognition, SQL generation, *and* (through the tool) database execution.
    - Suggestion of a **Domain API** instead: The agent should call an abstract endpoint like `/user/learning-summary` (hosted on Supabase/Edge Functions) rather than writing raw SQL.

## 2. LLM Factory and the Strategy Pattern
- **Question**: In `src/fastapi/app/core/llm.py`, the `make_llm` and `make_embedding_model` functions act as simple factories. Currently, they are hardcoded to return `ChatOpenAI`, `JinaEmbeddings`, or `OpenAIEmbeddings` based on environment variables. How would you refactor this using the **Strategy Pattern** to support a "Model-Agnostic" agent that can switch between Groq, Anthropic, or Local Ollama models based on a per-request configuration (from the `ChatRequest`) without changing any code in the agent nodes?
- **Why it matters**: Tests ability to design for extensibility and swap components without side effects.
- **Strong answer should include**:
    - Definition of an **Abstract Base Class (ABC)** or an **Interface** for the model provider.
    - Use of a **Registry** to map provider names to implementation strategies.
    - Injection of the provider strategy into the graph's `config` or `state` to be retrieved by nodes.

## 3. Tool Injection and the Decorator Pattern
- **Question**: The `_tool_executor.py` in `src/fastapi/app/agents/tutor_agent/nodes/` manually injects `user_id` and `jwt` into the arguments of tool functions before calling them. This relies on `getattr(target, "func", None)`. How would you improve this injection mechanism using **Python Decorators** or **Context Managers** so that the tool functions themselves are unaware of the `user_id` injection logic, and the executor doesn't have to "peek" into the tool's private attributes?
- **Why it matters**: Evaluates knowledge of encapsulation and how to leverage decorators for cross-cutting concerns (AOP - Aspect-Oriented Programming).
- **Strong answer should include**:
    - Implementation of a **@with_user_context** decorator.
    - Using **ContextVar** to store request-specific context (user_id/jwt) and having the tools pull it from there.
    - This decoupling makes tools more testable and less dependent on the specific executor implementation.
