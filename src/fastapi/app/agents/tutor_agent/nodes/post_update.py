"""Post-update node – persist chat, episodic, and semantic memory."""

from __future__ import annotations

import asyncio
import logging
import re
from typing import Any

from pydantic import BaseModel, Field

from app.agents.tutor_agent.state import TutorState
from app.core.config import settings
from app.core.llm import make_llm
from app.core.supabase import get_supabase_client
from app.domain.chat.services import ChatService
from app.domain.learning.services import LearningService
from app.repositories.learning import SupabaseLearningRepository
from app.schemas.memory import KnowledgeGraph
from app.services.memory import episodic_memory as ep_mem
from app.services.memory import semantic_memory as sem_mem

logger = logging.getLogger(__name__)
CHAT_PERSIST_TIMEOUT_S = 8.0
MEMORY_PERSIST_TIMEOUT_S = 8.0
TITLE_TIMEOUT_S = 4.0
SUMMARY_TIMEOUT_S = 4.0
KG_TIMEOUT_S = 6.0


async def _detect_referenced_units(output: str) -> list[dict[str, Any]]:
    matches = re.findall(r"[A-Za-z0-9:_-]+|[\u4e00-\u9faf]", output)
    unique_matches = []
    seen: set[str] = set()
    for match in matches:
        if match in seen:
            continue
        seen.add(match)
        unique_matches.append(match)
        if len(unique_matches) >= 8:
            break

    service = LearningService(SupabaseLearningRepository(get_supabase_client()))
    results_payload: list[dict[str, Any]] = []
    for match in unique_matches:
        results = await service.search_knowledge(match, limit=1)
        if not results:
            continue
        ku = results[0]
        results_payload.append(
            {"id": ku.id, "slug": ku.slug, "character": ku.character, "type": ku.type}
        )
        if len(results_payload) >= 3:
            break
    return results_payload


async def _run_with_timeout(coro: Any, timeout_s: float, label: str) -> Any | None:
    try:
        return await asyncio.wait_for(coro, timeout=timeout_s)
    except Exception as exc:
        logger.warning("%s failed: %s", label, exc)
        return None


async def post_update_node(state: TutorState) -> dict[str, Any]:
    """Persist the conversation turn and extract memories."""
    if not state.get("persist_artifacts", True):
        return {"thought": "Artifact persistence disabled for this session."}

    user_id = state["user_id"]
    session_id = state.get("session_id")
    user_input = state["user_input"]
    output = state.get("generation", "")
    chat_service = ChatService(get_supabase_client())

    async def _persist_chat() -> None:
        if not session_id:
            return
        await chat_service.upsert_chat_session(user_id, session_id)
        existing_messages = await chat_service.get_chat_messages(user_id, session_id)
        await chat_service.add_chat_message(user_id, session_id, "user", user_input)
        referenced_units = await _detect_referenced_units(output)
        await chat_service.add_chat_message(
            user_id,
            session_id,
            "assistant",
            output,
            metadata={"referenced_units": referenced_units},
        )

        if not existing_messages or len(existing_messages) < 2:
            title_llm = make_llm()
            title_response = await _run_with_timeout(
                title_llm.ainvoke(
                    f"Generate a very short (max 5 words) title for this conversation in Japanese. User: {user_input}"
                ),
                TITLE_TIMEOUT_S,
                "Title generation",
            )
            if title_response is not None:
                title = title_response.content.strip().replace('"', "").replace("*", "")
                await chat_service.update_chat_session(user_id, session_id, title=title)

    async def _persist_memory() -> None:
        summary_llm = make_llm()
        summary_response = await _run_with_timeout(
            summary_llm.ainvoke(
                f"Summarize this interaction in one sentence: User: {user_input}\nAI: {output}"
            ),
            SUMMARY_TIMEOUT_S,
            "Summary generation",
        )
        if summary_response is not None:
            ep_mem.add_episodic_memory(user_id, summary_response.content)

        extraction_llm = make_llm().with_structured_output(KnowledgeGraph)
        kg_data = await _run_with_timeout(
            extraction_llm.ainvoke(
                "Extract relationships from the interaction. "
                "Each relationship MUST follow this format: {'source': {'id': 'User', 'type': 'Person'}, 'target': {'id': 'Ramen', 'type': 'Food'}, 'type': 'LIKES'}. "
                "The source and target MUST be objects with 'id' and 'type'. "
                f"User: {user_input}\nAI: {output}"
            ),
            KG_TIMEOUT_S,
            "Knowledge extraction",
        )
        if kg_data is not None and settings.neo4j_uri and "neo4j" in settings.neo4j_uri:
            sem_mem.add_semantic_facts(user_id, kg_data)

    await _run_with_timeout(_persist_chat(), CHAT_PERSIST_TIMEOUT_S, "Chat persistence")
    await _run_with_timeout(_persist_memory(), MEMORY_PERSIST_TIMEOUT_S, "Memory persistence")

    # ── 3. Persist Tutor Behavioral State ──────────────────────────
    if session_id:
        from app.tutor.persistence import TutorPersistence
        from app.tutor.state import TutorSessionState
        try:
            # state is updated throughout the graph (e.g. in response_node)
            tutor_state = TutorSessionState.from_dict(state)
            await TutorPersistence.save(user_id, session_id, tutor_state)
        except Exception as e:
            logger.error("Failed to persist tutor behavioral state: %s", e)

    return {"thought": "Memories extracted and persisted to core storage."}
