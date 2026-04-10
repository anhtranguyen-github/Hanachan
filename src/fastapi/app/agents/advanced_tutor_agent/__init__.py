from __future__ import annotations

import time
from typing import Any

from langchain_core.messages import HumanMessage

from app.agents.advanced_tutor_agent.graph import build_graph, tutor_graph


async def run_chat(
    user_id: str,
    jwt: str,
    message: str,
    session_id: str | None = None,
) -> dict[str, Any]:
    """Invoke the tutor agent graph."""
    initial_state = {
        "user_id": user_id,
        "jwt": jwt,
        "session_id": session_id,
        "user_input": message,
        "messages": [HumanMessage(content=message)],
        "iterations": 0,
        "generation": "",
        "thread_context": "",
        "thought": "",
        "route": None,
        "needs_human_approval": False,
        "human_approved": False,
        "pending_sql_action": None,
        "start_time": time.time(),
    }
    config = {"configurable": {"thread_id": f"{user_id}:{session_id or 'default'}"}}
    result = await tutor_graph.ainvoke(initial_state, config=config)
    return {
        "response": result["generation"],
        "episodic_context": "Retrieved via agentic tools",
        "semantic_context": "Retrieved via agentic tools",
        "thread_context": "Dynamic",
    }


__all__ = ["build_graph", "tutor_graph", "run_chat"]
