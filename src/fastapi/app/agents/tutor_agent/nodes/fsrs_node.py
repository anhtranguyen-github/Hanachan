"""FSRS node – standalone learning progress queries."""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import AIMessage, SystemMessage

from app.agents.tutor_agent.merged_tools import _peek_active_study_card
from app.agents.tutor_agent.state import TutorState
from app.agents.tutor_agent.merged_tools import (
    evaluate_study_answer,
    get_due_items,
    get_recent_reviews,
    get_user_learning_progress,
    prepare_study_card,
    search_knowledge_units,
    submit_review,
)
from app.core.llm import make_llm

logger = logging.getLogger(__name__)

FSRS_TOOLS = [
    get_user_learning_progress,
    get_recent_reviews,
    get_due_items,
    prepare_study_card,
    evaluate_study_answer,
    search_knowledge_units,
    submit_review,
]


def _study_mode_from_input(user_input: str) -> str | None:
    normalized = " ".join(user_input.lower().strip().split())
    if any(token in normalized for token in ("review", "due card", "due cards", "due queue", "flashcard")):
        return "review"
    if any(token in normalized for token in ("learn", "lesson", "study", "quiz")):
        return "learn"
    return None


async def fsrs_node(state: TutorState) -> dict[str, Any]:
    """Query learning progress via LLM tool-calling (single round)."""
    user_id = state.get("user_id", "INJECTED")
    session_id = state.get("session_id")
    persist_artifacts = state.get("persist_artifacts", True)
    user_input = state.get("user_input", "")

    active_card = await _peek_active_study_card(
        user_id,
        session_id,
        persist_artifacts=persist_artifacts,
    )
    if active_card:
        result = await evaluate_study_answer.coroutine(
            user_answer=user_input,
            user_id=user_id,
            session_id=session_id,
            persist_artifacts=persist_artifacts,
        )
        return {
            "messages": [AIMessage(content=result, name="fsrs_node")],
            "thought": "FSRS node: evaluated answer for active study card.",
        }

    deterministic_mode = _study_mode_from_input(user_input)
    if deterministic_mode:
        result = await prepare_study_card.coroutine(
            mode=deterministic_mode,
            user_id=user_id,
            session_id=session_id,
            persist_artifacts=persist_artifacts,
        )
        return {
            "messages": [AIMessage(content=result, name="fsrs_node")],
            "thought": f"FSRS node: prepared {deterministic_mode} study card.",
        }

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
                "4. 'prepare_study_card': load the next lesson/review card into session state\n"
                "5. 'evaluate_study_answer': grade the learner's answer for the active study card\n"
                "6. 'search_knowledge_units': general info about Japanese items\n"
                "7. 'submit_review': record manual pass/again results\n\n"
                "STUDY FLOW: When the user wants to learn or review in chat, call 'prepare_study_card' first. "
                "When the user answers a current card, call 'evaluate_study_answer' instead of grading from memory.\n"
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
