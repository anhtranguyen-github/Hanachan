"""Human gate – HITL interrupt for sensitive operations."""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import ToolMessage
from langgraph.types import interrupt

from app.agents.advanced_tutor_agent.merged_tools import _execute_read_only_sql_impl
from app.agents.advanced_tutor_agent.state import TutorState

logger = logging.getLogger(__name__)


def human_gate_node(state: TutorState) -> dict[str, Any]:
    """Pause execution and wait for human approval."""
    pending_sql_action = state.get("pending_sql_action")
    logger.info("human_gate: requesting human approval")
    approval = interrupt(
        {
            "question": "The agent wants to perform a sensitive action. Approve?",
            "context": state.get("thought", ""),
            "pending_sql_action": pending_sql_action,
        }
    )

    approved = approval if isinstance(approval, bool) else str(approval).lower() in ("yes", "true", "approve")
    if not pending_sql_action:
        return {
            "human_approved": approved,
            "needs_human_approval": False,
            "thought": f"Human approval: {'granted' if approved else 'denied'}.",
        }

    if not approved:
        return {
            "human_approved": False,
            "needs_human_approval": False,
            "pending_sql_action": None,
            "messages": [
                ToolMessage(
                    tool_call_id=pending_sql_action["tool_call_id"],
                    content="SQL execution denied by human approval.",
                    name=pending_sql_action["tool_name"],
                )
            ],
            "thought": "Human approval denied the pending SQL query.",
        }

    result = _execute_read_only_sql_impl(
        pending_sql_action["sql"],
        user_id=state.get("user_id"),
    )
    return {
        "human_approved": True,
        "needs_human_approval": False,
        "pending_sql_action": None,
        "messages": [
            ToolMessage(
                tool_call_id=pending_sql_action["tool_call_id"],
                content=result,
                name=pending_sql_action["tool_name"],
            )
        ],
        "thought": "Human approval granted and pending SQL query executed.",
    }
