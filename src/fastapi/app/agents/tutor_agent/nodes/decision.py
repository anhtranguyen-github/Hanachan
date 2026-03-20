"""Decision node – loop-or-advance logic."""

from __future__ import annotations

import logging
import time
from typing import Any

from app.agents.tutor_agent.constraints import GLOBAL_TIMEOUT_S, MAX_ITERATIONS
from app.agents.tutor_agent.state import TutorState

logger = logging.getLogger(__name__)


def decision_node(state: TutorState) -> dict[str, Any]:
    """Decide whether to loop back to router, request human approval, or proceed to output."""
    iterations = state.get("iterations", 0)
    elapsed = time.time() - state.get("start_time", 0)

    # Safety: always advance if we've hit limits
    if iterations >= MAX_ITERATIONS or elapsed > GLOBAL_TIMEOUT_S:
        logger.info(f"decision_node: advancing (iterations={iterations}, elapsed={elapsed:.1f}s)")
        return {"thought": "Iteration/time limit reached, proceeding to generate."}

    # Check if the last messages contain useful tool results
    messages = state.get("messages", [])
    has_context = any(
        getattr(m, "name", None) in ("memory_node", "fsrs_node", "sql_node")
        or getattr(m, "type", None) == "tool"
        for m in messages[-5:]
    )

    if has_context:
        return {"thought": "Sufficient context gathered, proceeding to generate."}

    # No useful context yet — loop back
    return {
        "thought": "Insufficient context, looping back to router.",
    }


def decision_router(state: TutorState) -> str:
    """Conditional edge function for the decision node."""
    iterations = state.get("iterations", 0)
    elapsed = time.time() - state.get("start_time", 0)

    if iterations >= MAX_ITERATIONS or elapsed > GLOBAL_TIMEOUT_S:
        return "ready"

    if state.get("needs_human_approval"):
        return "needs_approval"

    messages = state.get("messages", [])
    has_context = any(
        getattr(m, "name", None) in ("memory_node", "fsrs_node", "sql_node")
        or getattr(m, "type", None) == "tool"
        for m in messages[-5:]
    )

    if has_context:
        return "ready"

    return "needs_more"
