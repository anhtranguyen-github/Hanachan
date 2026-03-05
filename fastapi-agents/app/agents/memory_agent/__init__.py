from typing import Any
from langchain_core.messages import HumanMessage
from app.agents.memory_agent.graph import memory_graph
from app.services.memory import episodic_memory as ep_mem
from app.services.memory import semantic_memory as sem_mem

async def run_chat(
    user_id: str,
    jwt: str,
    message: str,
    session_id: str | None = None,
    tts_enabled: bool = True,
) -> dict[str, Any]:
    """Invoke the iterative memory-augmented agent."""

    # Initialize state
    initial_state = {
        "user_id": user_id,
        "jwt": jwt,
        "session_id": session_id,
        "user_input": message,
        "messages": [HumanMessage(content=message)],
        "iterations": 0,
        "generation": "",
        "audio_file": None,
        "tts_enabled": tts_enabled,
        "thread_context": "",
        "retrieved_episodic": "",
        "retrieved_semantic": "",
    }

    result = await memory_graph.ainvoke(initial_state)

    return {
        "response": result["generation"],
        "audio_file": result.get("audio_file"),
        "episodic_context": "Retrieved via agentic tools",
        "semantic_context": "Retrieved via agentic tools",
        "thread_context": "Dynamic",
    }

__all__ = ["memory_graph", "run_chat"]
