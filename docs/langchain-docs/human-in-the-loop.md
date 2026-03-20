# Human-in-the-Loop (HITL) in LangChain & LangGraph: Tutorials and Best Practices

Human-in-the-Loop (HITL) inserts human oversight, approval, editing, or rejection into agent workflows, essential for high-stakes actions like SQL executions, file modifications, or sending emails.

## Tutorial

### Installation
```bash
uv pip install -U langchain langgraph
```

### Method 1: `HumanInTheLoopMiddleware` (Agent-Friendly)
Best for classic LangChain agents when intercepting dangerous tool calls.

```python
from langchain.agents import create_react_agent
from langchain.agents.middleware import HumanInTheLoopMiddleware
from langgraph.checkpoint.memory import MemorySaver

memory = MemorySaver()
hitl_mw = HumanInTheLoopMiddleware(
    interrupt_on={
        "execute_sql": {"allowed_decisions": ["approve", "reject"]},
        "send_email": True, 
    }
)

agent = create_react_agent(llm=your_llm, tools=[...], middleware=[hitl_mw], checkpointer=memory)

# Resume logic with v2 style:
resume_cmd = {"decisions": [{"type": "approve"}]}
agent.invoke({"__command__": resume_cmd}, config=config, version="v2")
```

### Method 2: Native LangGraph Interrupts (Recommended for Custom Flows)
Use static breakpoints (`interrupt_before`) or dynamic `interrupt(...)` calls deeply inside nodes.

```python
from langgraph.types import interrupt

def risky_tool_node(state):
    proposed_args = state["tool_args"]
    # Dynamic pause execution:
    response = interrupt(f"Approve action with args: {proposed_args}? (yes/edit/reject)")
    
    if response.startswith("reject"):
        return {"messages": ["Action rejected by human"]}
    return do_execute(proposed_args)
```

## Best Practices (2025–2026)
1. **Persistent Checkpointing**: Always leverage a persistent checkpointer (e.g., `AsyncPostgresSaver`, `Redis`) in production environments rather than memory.
2. **Conservative Editing**: If a human edits inputs during pauses, ensure changes are minor. Extensive structural edits can severely derail the agent structure moving forward.
3. **Structured Context**: When opting out/rejecting (using `{"type": "reject"}`), always supply a message to pass to the agent context explaining why their move was unsafe.
4. **Tool-Level Prioritization**: Prefer tool-level HITL triggers over globally interrupting workflows, and consider confidence-based escalation thresholds.
5. **Observability**: Employ LangSmith along with LangGraph checkpointers to trace threads waiting for resolutions.
