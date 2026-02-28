"""
Memory Consolidation Module.
"""

from __future__ import annotations

import hashlib
import logging
from typing import List

from langchain_core.prompts import ChatPromptTemplate
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from . import episodic_memory as ep_mem
from ...core.config import settings
from ...core.database import get_db
from ...core.llm import make_llm
from ...schemas.memory import ConsolidationResult, EpisodicMemory

logger = logging.getLogger(__name__)

CONSOLIDATION_THRESHOLD = 10  # consolidate when user has > N memories
BATCH_SIZE = 5  # merge N memories at a time

# ---------------------------------------------------------------------------
# LLM (created fresh per call so timeout is always applied)
# ---------------------------------------------------------------------------

_CONSOLIDATION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert at consolidating memories. Given a list of short memory "
            "summaries about a user's interactions, synthesise them into a single, richer, "
            "concise summary that preserves all important facts without redundancy. "
            "Write in third person. Keep it under 3 sentences.",
        ),
        (
            "human",
            "Memories to consolidate:\n{memories}",
        ),
    ]
)

# ---------------------------------------------------------------------------
# Core consolidation logic
# ---------------------------------------------------------------------------


def _consolidate_batch(
    user_id: str,
    memories: List[EpisodicMemory],
    client: QdrantClient,
) -> str:
    """Merge a batch of memories → one consolidated string, replace in Qdrant."""
    memories_text = "\n".join(f"- {m.text}" for m in memories)

    chain = _CONSOLIDATION_PROMPT | make_llm()
    consolidated = chain.invoke({"memories": memories_text}).content.strip()

    # Delete originals
    ids_to_delete = [m.id for m in memories]
    client.delete(
        collection_name=settings.qdrant_collection,
        points_selector=qmodels.PointIdsList(points=ids_to_delete),
    )

    # Insert consolidated memory
    ep_mem.add_episodic_memory(user_id, f"[Consolidated] {consolidated}")

    return consolidated


def consolidate_memories(user_id: str) -> ConsolidationResult:
    """Run consolidation for a user, protected by a PostgreSQL advisory lock.

    If another consolidation is already running for this user the call returns
    immediately with a "in progress" message rather than duplicating work.
    """
    # Derive a stable 31-bit integer key from the user_id
    lock_key = int(hashlib.md5(user_id.encode()).hexdigest(), 16) % (2**31)

    # Use a single connection for both lock acquisition and release
    # so that the lock is held on the same connection for release
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT pg_try_advisory_lock(%s)", (lock_key,))
            acquired = cur.fetchone()[0]

            if not acquired:
                logger.info(
                    "consolidation_skipped_locked",
                    extra={"user_id": user_id},
                )
                return ConsolidationResult(
                    user_id=user_id,
                    memories_before=0,
                    memories_after=0,
                    batches_merged=0,
                    message="Consolidation already in progress for this user.",
                )

            try:
                # Run consolidation while holding the lock on this connection
                result = _do_consolidate(user_id)
                return result
            finally:
                # Release the lock using the same connection
                cur.execute("SELECT pg_advisory_unlock(%s)", (lock_key,))


def _do_consolidate(user_id: str) -> ConsolidationResult:
    all_memories = ep_mem.list_episodic_memories(user_id, limit=200)
    total_before = len(all_memories)

    # Filter out already-consolidated memories to avoid over-compression
    non_consolidated = [
        m for m in all_memories if not m.text.startswith("[Consolidated]")
    ]

    if len(non_consolidated) <= CONSOLIDATION_THRESHOLD:
        return ConsolidationResult(
            user_id=user_id,
            memories_before=total_before,
            memories_after=total_before,
            batches_merged=0,
            message=(
                f"No consolidation needed ({len(non_consolidated)} raw memories "
                f"≤ threshold {CONSOLIDATION_THRESHOLD})."
            ),
        )

    client = ep_mem._get_client()

    # Batch the non-consolidated memories oldest-first
    sorted_memories = sorted(non_consolidated, key=lambda m: m.created_at or "")
    batches_merged = 0
    consolidated_summaries: List[str] = []

    for i in range(0, len(sorted_memories), BATCH_SIZE):
        batch = sorted_memories[i : i + BATCH_SIZE]
        if len(batch) < 2:
            break
        try:
            summary = _consolidate_batch(user_id, batch, client)
            consolidated_summaries.append(summary)
            batches_merged += 1
        except Exception as exc:
            logger.error(
                "consolidation_batch_error",
                extra={"user_id": user_id, "batch_index": i, "error": str(exc)},
            )

    all_after = ep_mem.list_episodic_memories(user_id, limit=200)
    total_after = len(all_after)

    return ConsolidationResult(
        user_id=user_id,
        memories_before=total_before,
        memories_after=total_after,
        batches_merged=batches_merged,
        message=f"Consolidated {batches_merged} batches. {total_before} → {total_after} memories.",
    )
