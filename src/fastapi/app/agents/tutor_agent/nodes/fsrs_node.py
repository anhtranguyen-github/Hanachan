"""FSRS node – standalone learning progress queries."""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import AIMessage, SystemMessage

from app.agents.tutor_agent.state import TutorState
from app.agents.tutor_agent.merged_tools import (
    get_due_items,
    get_recent_reviews,
    get_user_learning_progress,
    search_knowledge_units,
    submit_review,
)
from app.core.llm import make_llm

logger = logging.getLogger(__name__)

FSRS_TOOLS = [
    get_user_learning_progress,
    get_recent_reviews,
    get_due_items,
    search_knowledge_units,
    submit_review,
]


async def fsrs_node(state: TutorState) -> dict[str, Any]:
    """Query learning progress via LLM tool-calling (single round)."""
    llm = make_llm().bind_tools(FSRS_TOOLS)

    prompt = [
        SystemMessage(
            content=(
                "You are a Spaced-Repetition (FSRS) Analyst for Hanachan.\n"
                "Your goal is to answer questions about the user's learning progress, "
                "what they've studied recently, and what's due for review.\n"
                "Key Tools:\n"
                "1. 'get_user_learning_progress': specific characters/words/UUIDs\n"
                "2. 'get_recent_reviews': recent activity\n"
                "3. 'get_due_items': items due for study\n"
                "4. 'search_knowledge_units': general info about Japanese items\n"
                "5. 'submit_review': record pass/again results\n\n"
                "PROACTIVE SEARCH: If the user mentions a specific character (e.g. '猫'), ALWAYS call 'search_knowledge_units' to get its structural and mnemonic details, even if the user has no practice history yet."
            )
        ),
    ]
    prompt.extend(state["messages"])

    response = await llm.ainvoke(prompt)

    # If the LLM wants to call tools, execute them inline
    if hasattr(response, "tool_calls") and response.tool_calls:
        from app.agents.tutor_agent.nodes._tool_executor import execute_tool_calls

        tool_results = await execute_tool_calls(response.tool_calls, FSRS_TOOLS, state)
        return {
            "messages": [response] + tool_results,
            "thought": "FSRS node: executed tool calls for learning data.",
        }

    return {
        "messages": [response],
        "thought": "FSRS node: responded directly.",
    }
