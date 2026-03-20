# Guardrails in LangChain: Tutorials and Best Practices (2026 Edition)

Guardrails help build safe, compliant AI applications by validating and filtering content at key points in an agent's execution. They prevent issues like PII leakage, prompt injection, and harmful content.

## Tutorial

### Installation
```bash
uv pip install -U langchain langgraph
```

LangChain's recommended approach (2026) uses **middleware** that runs at specific lifecycle points.

### Built-in Middleware (PII & HITL)
Detect and handle common PII types (email, credit_card, ip) with strategies like `redact`, `mask`, `hash`, or `block`.

```python
from langchain.agents import create_agent
from langchain.agents.middleware import PIIMiddleware, HumanInTheLoopMiddleware

agent = create_agent(
    model="gpt-4.1",
    tools=[...],
    middleware=[
        PIIMiddleware(pii_type="email", strategy="redact", apply_to_input=True),
        PIIMiddleware(pii_type="credit_card", strategy="mask", apply_to_input=True),
        HumanInTheLoopMiddleware(interrupt_on={"delete_database": True})
    ]
)
```

### Custom Middleware
Inherit from `AgentMiddleware` to intercept at specific hooks (`before_agent`, `after_agent`).

```python
from langchain.agents.middleware import AgentMiddleware, AgentState, hook_config

class ContentFilterMiddleware(AgentMiddleware):
    def __init__(self, banned_keywords: list[str]):
        self.banned_keywords = banned_keywords

    @hook_config(can_jump_to=["end"])
    def before_agent(self, state: AgentState, runtime):
        # Implementation to short-circuit if a banned keyword is found
        return {"jump_to": "end"}
```

## Best Practices
1. **Combine Deterministic and Model-based Checks**: Layer fast, predictable deterministic rule-based checks (regex, allow/block lists) first, and only use slower, more expensive LLM-based semantic checks when necessary.
2. **Hook Selection**: Use `before_agent` hooks for filtering input requests (like blocking prompt injection) and `after_agent` hooks for final output checks.
3. **Short-Circuit Execution**: In custom middleware checks, accurately `jump_to: "end"` and supply a safe default response message if a violation is detected.
