"""Router – LLM-based intent classification."""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.agents.advanced_tutor_agent.state import TutorState
from app.core.llm import make_llm

logger = logging.getLogger(__name__)

ROUTER_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an intent router for a Japanese learning assistant.\n\n"
            "Classify the user's message into exactly ONE route:\n"
            "- memory  → questions about past conversations, personal facts, user preferences\n"
            "- fsrs    → learning progress, reviews, due items, knowledge unit details\n"
            "- sql     → structured data queries (counts, stats, lesson info)\n"
            "- direct  → general conversation, greetings, or questions you can answer without tools\n\n"
            "User session context:\n{thread_context}\n"
            "Current Date: {date}",
        ),
        ("placeholder", "{messages}"),
    ]
)


class RouteDecision(BaseModel):
    route: str = Field(description="One of: memory, fsrs, sql, direct")
    reasoning: str = Field(description="Short explanation of why this route was chosen")


async def router_node(state: TutorState) -> dict[str, Any]:
    """Classify user intent and return a route label."""
    llm = make_llm().with_structured_output(RouteDecision)

    thread_text = state.get("thread_context") or "(no active session)"
    if not thread_text or thread_text == "":
        thread_text = "(no active session)"

    chain = ROUTER_PROMPT | llm
    decision = await chain.ainvoke(
        {
            "messages": state["messages"],
            "thread_context": thread_text,
            "date": datetime.now().strftime("%Y-%m-%d"),
        }
    )

    return {
        "route": decision.route,
        "thought": f"Router → {decision.route}: {decision.reasoning}",
        "iterations": state.get("iterations", 0) + 1,
    }
