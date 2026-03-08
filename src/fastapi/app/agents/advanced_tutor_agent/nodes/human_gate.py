"""Human gate – HITL interrupt for sensitive operations."""

from __future__ import annotations

import logging
from typing import Any

from langgraph.types import interrupt

from app.agents.advanced_tutor_agent.state import TutorState

logger = logging.getLogger(__name__)


def human_gate_node(state: TutorState) -> dict[str, Any]:
    """Pause execution and wait for human approval."""
    logger.info("human_gate: requesting human approval")
    approval = interrupt(
        {
            "question": "The agent wants to perform a sensitive action. Approve?",
            "context": state.get("thought", ""),
        }
    )

    approved = approval if isinstance(approval, bool) else str(approval).lower() in ("yes", "true", "approve")
    return {
        "human_approved": approved,
        "thought": f"Human approval: {'granted' if approved else 'denied'}.",
    }
