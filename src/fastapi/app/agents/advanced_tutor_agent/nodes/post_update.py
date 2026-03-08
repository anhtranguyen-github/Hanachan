"""Post-update node – persist chat, episodic, and semantic memory."""

from __future__ import annotations

import logging
from typing import Any

from pydantic import BaseModel, Field

from app.agents.advanced_tutor_agent.state import TutorState
from app.core.llm import make_llm
from app.core.supabase import get_supabase_client
from app.domain.chat.services import ChatService
from app.schemas.memory import KnowledgeGraph
from app.services.memory import episodic_memory as ep_mem
from app.services.memory import semantic_memory as sem_mem

logger = logging.getLogger(__name__)


async def post_update_node(state: TutorState) -> dict[str, Any]:
    """Persist the conversation turn and extract memories."""
    user_id = state["user_id"]
    session_id = state.get("session_id")
    user_input = state["user_input"]
    output = state.get("generation", "")
    chat_service = ChatService(get_supabase_client())

    # ── Persist chat messages ─────────────────────────────
    if session_id:
        try:
            await chat_service.upsert_chat_session(user_id, session_id)
            existing_messages = await chat_service.get_chat_messages(user_id, session_id)
            await chat_service.add_chat_message(user_id, session_id, "user", user_input)
            await chat_service.add_chat_message(user_id, session_id, "assistant", output)

            # Generate title for new sessions
            if not existing_messages or len(existing_messages) < 2:
                try:
                    title_llm = make_llm()
                    title_res = title_llm.invoke(
                        f"Generate a very short (max 5 words) title for this conversation in Japanese. User: {user_input}"
                    ).content
                    title = title_res.strip().replace('"', "").replace("*", "")
                    await chat_service.update_chat_session(user_id, session_id, title=title)
                except Exception as te:
                    logger.error(f"Failed to generate title: {te}")
        except Exception as e:
            logger.error(f"Failed to persist chat: {e}")

    # ── Extract and persist memories ──────────────────────
    try:
        summary_llm = make_llm()
        summary = summary_llm.invoke(
            f"Summarize this interaction in one sentence: User: {user_input}\nAI: {output}"
        ).content
        ep_mem.add_episodic_memory(user_id, summary)

        extraction_llm = make_llm().with_structured_output(KnowledgeGraph)
        kg_data = extraction_llm.invoke(
            "Extract relationships from the interaction. "
            "Each relationship MUST follow this format: {'source': {'id': 'User', 'type': 'Person'}, 'target': {'id': 'Ramen', 'type': 'Food'}, 'type': 'LIKES'}. "
            "The source and target MUST be objects with 'id' and 'type'. "
            f"User: {user_input}\nAI: {output}"
        )
        sem_mem.add_semantic_facts(user_id, kg_data)
    except Exception as e:
        logger.error(f"Memory persistence failed: {e}")

    return {"thought": "Memories extracted and persisted to core storage."}
