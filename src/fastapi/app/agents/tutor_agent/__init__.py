from __future__ import annotations

import time
from typing import Any

from langchain_core.messages import HumanMessage

from app.agents.tutor_agent.graph import build_graph, tutor_graph
from app.services.memory.session_memory import get_thread_context_text


async def run_chat(
    user_id: str,
    jwt: str,
    message: str,
    session_id: str | None = None,
    persist_artifacts: bool = True,
) -> dict[str, Any]:
    """Invoke the tutor agent graph."""
    thread_context = ""
    if persist_artifacts and session_id:
        try:
            thread_context = await get_thread_context_text(jwt, session_id)
        except Exception:
            thread_context = ""

    config = {"configurable": {"thread_id": f"{user_id}:{session_id or 'default'}"}}

    updates: dict[str, Any] = {
        "user_input": message,
        "messages": [HumanMessage(content=message)],
        "iterations": 0,
        "thought": "",
        "route": None,
        "start_time": time.time(),
    }

    # ── Database Layer State Loading ────────────────────────────
    from app.tutor.persistence import TutorPersistence
    persistent_tutor_state = await TutorPersistence.load(user_id, session_id or "default")
    updates.update(persistent_tutor_state.to_dict())

    # Ensure identity fields are correct
    updates.update({
        "user_id": user_id,
        "jwt": jwt,
        "session_id": session_id,
        "persist_artifacts": persist_artifacts,
        "thread_context": thread_context,
    })

    result = await tutor_graph.ainvoke(updates, config=config)
    return {
        "response": result["generation"],
        "episodic_context": "Retrieved via agentic tools",
        "semantic_context": "Retrieved via agentic tools",
        "thread_context": thread_context,
    }


__all__ = ["build_graph", "tutor_graph", "run_chat"]
