"""Response node – final text generation using LLM-augmented TutorEngine."""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import AIMessage, SystemMessage
from langchain_core.prompts import ChatPromptTemplate

from app.core.supabase import get_supabase_client
from app.repositories.learning import SupabaseLearningRepository
from app.domain.learning.services import LearningService
from app.tutor.state import TutorSessionState
from app.tutor.engine import TutorEngine
from app.core.llm import make_llm

logger = logging.getLogger(__name__)

# This is the master prompt for Hanachan
HANACHAN_SYSTEM_PROMPT = """
You are Hanachan (はなちゃん), a friendly, encouraging, and expert Japanese tutor. 
Your goal is to guide the student through their Japanese journey with warmth and wit. 😊✨🌸

CORE PERSONALITY:
- Interactive & Supportive: Use emojis naturally. Encourage the student but correct their errors immediately.
- Language Balance: Respond PRIMARILY in Japanese (with romaji in parentheses). Use English or the student's native language only for brief clarifications.
- Memory: Remember small details if they provided them in the history (e.g., favorite food, city).
- Socratic Pedagogy: If they ask for a direct answer to a homework question, provide a hint instead of the answer.

TUTOR ACTION:
Your behavior is guided by the following context from your backend 'Tutor Engine':
- Action: {action}
- Note: {note}
- Content: {items}

Respond naturally to the user as Hanachan, incorporating the above 'Content' (if any) as the main lesson material for this turn.
If multiple items are provided, introduce them in a friendly batch.
"""

async def response_node(state: Any) -> dict[str, Any]:
    """Generate the final response using the LLM-augmented TutorEngine."""
    user_id = state["user_id"]
    session_id = state.get("session_id")
    user_input = state["user_input"]
    messages = state["messages"]

    # ── 1. Orchestrate with TutorEngine (Real Data Lookup) ────────
    session_state = TutorSessionState.from_dict(state)
    client = get_supabase_client()
    repo = SupabaseLearningRepository(client)
    learning_service = LearningService(repo)
    
    engine = TutorEngine(session_state, learning_service)
    tutor_context = await engine.get_tutor_context(user_input)

    # ── 2. Invoke LLM for Final Narrative ─────────────────────────
    llm = make_llm()
    
    # Construct the personalized prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", HANACHAN_SYSTEM_PROMPT),
        ("placeholder", "{messages}"),
        ("human", "{user_input}")
    ])
    
    chain = prompt | llm
    
    # Generate the actual chat message
    response = await chain.ainvoke({
        "messages": messages,
        "user_input": user_input,
        "action": tutor_context["action"],
        "note": tutor_context["note"],
        "items": tutor_context["items"],
    })

    # ── 3. Combine Updates ────────────────────────────────────────
    updates = session_state.to_dict()
    updates["generation"] = response.content
    updates["thought"] = f"Action: {tutor_context['action']} (LLM-generated narrative)."
    return updates
