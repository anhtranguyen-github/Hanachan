"""Memory node – standalone episodic + semantic retrieval."""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import AIMessage

from app.agents.advanced_tutor_agent.state import TutorState
from app.services.memory import episodic_memory as ep_mem
from app.services.memory import semantic_memory as sem_mem

logger = logging.getLogger(__name__)


def memory_node(state: TutorState) -> dict[str, Any]:
    """Retrieve episodic and semantic memory for the user."""
    user_id = state["user_id"]
    query = state["user_input"]

    # Episodic search
    try:
        episodic_results = ep_mem.search_episodic_memory(user_id, query, k=3)
    except Exception as e:
        logger.warning(f"Episodic memory retrieval failed: {e}")
        episodic_results = []
    episodic_text = (
        "\n".join([f"- {r.text} (score: {r.score})" for r in episodic_results])
        if episodic_results
        else "No relevant past conversations found."
    )

    # Semantic search – extract keywords from the query
    keywords = [w for w in query.split() if len(w) > 2][:5]
    try:
        semantic_results = sem_mem.search_semantic_memory(user_id, keywords) if keywords else []
    except Exception as e:
        logger.warning(f"Semantic memory retrieval failed: {e}")
        semantic_results = []
    semantic_text = (
        "\n".join(
            [
                f"- ({r['source'].get('id')}) —[{r['relationship']}]→ ({r['target'].get('id')})"
                for r in semantic_results[:15]
            ]
        )
        if semantic_results
        else "No specific facts found."
    )

    context = f"[Memory Context]\nEpisodic:\n{episodic_text}\n\nSemantic:\n{semantic_text}"
    return {
        "messages": [AIMessage(content=context, name="memory_node")],
        "thought": f"Memory retrieved {len(episodic_results)} episodic, {len(semantic_results)} semantic results.",
    }
