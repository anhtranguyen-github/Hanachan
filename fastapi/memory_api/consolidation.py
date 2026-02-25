"""
Memory Consolidation Module.

Periodically merges multiple episodic memories into richer, more compressed
summaries to prevent memory bloat and improve recall quality over time.

Algorithm:
  1. Fetch all episodic memories for the user from Qdrant.
  2. If count > threshold, batch them (N at a time).
  3. For each batch, call the LLM to produce a single consolidated summary.
  4. Delete the source memories from Qdrant.
  5. Insert the new consolidated summary.

The function is idempotent — safe to call repeatedly.
"""
from __future__ import annotations

import uuid
from typing import List, Tuple

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

import episodic_memory as ep_mem
from config import settings
from models import ConsolidationResult, EpisodicMemory

CONSOLIDATION_THRESHOLD = 10   # consolidate when user has > N memories
BATCH_SIZE = 5                  # merge N memories at a time

# ---------------------------------------------------------------------------
# LLM
# ---------------------------------------------------------------------------

_llm = None


def _get_llm() -> ChatOpenAI:
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(
            model=settings.llm_model,
            temperature=0,
            openai_api_key=settings.openai_api_key,
        )
    return _llm


_CONSOLIDATION_PROMPT = ChatPromptTemplate.from_messages([
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
])


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

    # LLM consolidation
    chain = _CONSOLIDATION_PROMPT | _get_llm()
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
    """
    Run consolidation for a user if they exceed the threshold.
    Returns a ConsolidationResult describing what happened.
    """
    all_memories = ep_mem.list_episodic_memories(user_id, limit=200)
    total_before = len(all_memories)

    # Filter out already-consolidated memories to avoid over-compression
    non_consolidated = [m for m in all_memories if not m.text.startswith("[Consolidated]")]

    if len(non_consolidated) <= CONSOLIDATION_THRESHOLD:
        return ConsolidationResult(
            user_id=user_id,
            memories_before=total_before,
            memories_after=total_before,
            batches_merged=0,
            message=f"No consolidation needed ({len(non_consolidated)} raw memories ≤ threshold {CONSOLIDATION_THRESHOLD}).",
        )

    client = ep_mem._get_client()

    # Batch the non-consolidated memories oldest-first
    sorted_memories = sorted(non_consolidated, key=lambda m: m.created_at or "")
    batches_merged = 0
    consolidated_summaries: List[str] = []

    for i in range(0, len(sorted_memories), BATCH_SIZE):
        batch = sorted_memories[i : i + BATCH_SIZE]
        if len(batch) < 2:
            break  # Don't compress a single memory
        try:
            summary = _consolidate_batch(user_id, batch, client)
            consolidated_summaries.append(summary)
            batches_merged += 1
        except Exception as exc:
            print(f"[consolidation] batch {i} error: {exc}")

    all_after = ep_mem.list_episodic_memories(user_id, limit=200)
    total_after = len(all_after)

    return ConsolidationResult(
        user_id=user_id,
        memories_before=total_before,
        memories_after=total_after,
        batches_merged=batches_merged,
        message=f"Consolidated {batches_merged} batches. {total_before} → {total_after} memories.",
    )
