"""Response node – final text generation."""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.prompts import ChatPromptTemplate

from app.agents.tutor_agent.state import TutorState
from app.core.llm import make_llm

logger = logging.getLogger(__name__)

GENERATION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are Hanachan, a helpful Japanese learning assistant.\n\n"
            "RESPONSE GUIDELINES:\n"
            "1. CONFIRM SAVES: If you see a tool result from 'add_episodic_memory', confirm to the user that you've remembered that specific fact.\n"
            "2. COLD START HELPFULNESS: If SQL/FSRS tools return empty results (new user), do NOT say 'I don't have access'. Instead:\n"
            "   - For reviews: Say 'You're all caught up! Let's start a new lesson.'\n"
            "   - For 'wrong' or 'meaning' queries: Use the provided dictionary context (Tool Result: search_knowledge_units) to explain the character's RADICALS and MNEMONICS immediately.\n"
            "3. BE SPECIFIC: Always address the user's latest query directly before offering general guidance.\n\n"
            "Context:\n{messages}",
        ),
        ("human", "{user_input}"),
    ]
)


def response_node(state: TutorState) -> dict[str, Any]:
    """Generate the final response based on all gathered context."""
    llm = make_llm()
    chain = GENERATION_PROMPT | llm

    lines = []
    for m in state["messages"]:
        role = m.type.capitalize()
        if m.type == "ai" and hasattr(m, "tool_calls") and m.tool_calls:
            calls = ", ".join([tc["name"] for tc in m.tool_calls])
            lines.append(f"{role} (Calling tools: {calls}): {m.content}")
        elif m.type == "tool":
            lines.append(f"Tool Result ({getattr(m, 'name', 'unknown')}): {m.content}")
        else:
            lines.append(f"{role}: {m.content}")
    messages_text = "\n".join(lines)

    response = chain.invoke({"user_input": state["user_input"], "messages": messages_text})
    return {"generation": response.content, "thought": "Final answer generated."}
