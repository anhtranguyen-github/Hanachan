"""
Episodic Memory Module — backed by Qdrant (cloud).

Each memory is a short text summary (e.g. of a conversation turn) that is
embedded with OpenAI text-embedding-3-small and stored in a Qdrant collection
named `episodic_memory`.  Multi-user isolation is achieved by storing
`user_id` as a payload field and filtering all queries.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import List

from langchain_openai import OpenAIEmbeddings
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from config import settings
from models import EpisodicMemory


# ---------------------------------------------------------------------------
# Singleton client & embedder
# ---------------------------------------------------------------------------

_client: QdrantClient | None = None
_embedder: OpenAIEmbeddings | None = None


def _get_client() -> QdrantClient:
    global _client
    if _client is None:
        _client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            timeout=30,
        )
    return _client


def _get_embedder() -> OpenAIEmbeddings:
    global _embedder
    if _embedder is None:
        _embedder = OpenAIEmbeddings(
            model=settings.embedding_model,
            openai_api_key=settings.openai_api_key,
        )
    return _embedder


# ---------------------------------------------------------------------------
# Initialisation
# ---------------------------------------------------------------------------

def init_qdrant() -> None:
    """Create the `episodic_memory` collection if it does not already exist."""
    client = _get_client()
    existing = {c.name for c in client.get_collections().collections}
    if settings.qdrant_collection not in existing:
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=qmodels.VectorParams(
                size=settings.embedding_dimensions,
                distance=qmodels.Distance.COSINE,
            ),
        )
        # Create a payload index on user_id to speed up filtered queries
        client.create_payload_index(
            collection_name=settings.qdrant_collection,
            field_name="user_id",
            field_schema=qmodels.PayloadSchemaType.KEYWORD,
        )


def health_check() -> str:
    """Return 'ok' if Qdrant is reachable, else error message."""
    try:
        _get_client().get_collections()
        return "ok"
    except Exception as exc:
        return f"error: {exc}"


# ---------------------------------------------------------------------------
# CRUD helpers
# ---------------------------------------------------------------------------

def add_episodic_memory(user_id: str, text: str) -> str:
    """Embed *text* and upsert it into Qdrant. Returns the point id."""
    client = _get_client()
    embedder = _get_embedder()

    vector = embedder.embed_query(text)
    point_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    client.upsert(
        collection_name=settings.qdrant_collection,
        points=[
            qmodels.PointStruct(
                id=point_id,
                vector=vector,
                payload={
                    "user_id": user_id,
                    "text": text,
                    "created_at": created_at,
                },
            )
        ],
    )
    return point_id


def search_episodic_memory(user_id: str, query: str, k: int = 3) -> List[EpisodicMemory]:
    """Similarity search restricted to *user_id*; returns top-k results."""
    client = _get_client()
    embedder = _get_embedder()

    vector = embedder.embed_query(query)
    results = client.search(
        collection_name=settings.qdrant_collection,
        query_vector=vector,
        limit=k,
        query_filter=qmodels.Filter(
            must=[
                qmodels.FieldCondition(
                    key="user_id",
                    match=qmodels.MatchValue(value=user_id),
                )
            ]
        ),
        with_payload=True,
    )
    return [
        EpisodicMemory(
            id=str(hit.id),
            text=hit.payload.get("text", ""),
            score=hit.score,
            created_at=hit.payload.get("created_at"),
        )
        for hit in results
    ]


def list_episodic_memories(user_id: str, limit: int = 50) -> List[EpisodicMemory]:
    """List all episodic memories for *user_id* (no ranking, newest first)."""
    client = _get_client()
    records, _ = client.scroll(
        collection_name=settings.qdrant_collection,
        scroll_filter=qmodels.Filter(
            must=[
                qmodels.FieldCondition(
                    key="user_id",
                    match=qmodels.MatchValue(value=user_id),
                )
            ]
        ),
        limit=limit,
        with_payload=True,
    )
    memories = [
        EpisodicMemory(
            id=str(r.id),
            text=r.payload.get("text", ""),
            created_at=r.payload.get("created_at"),
        )
        for r in records
    ]
    # Sort newest first
    memories.sort(key=lambda m: m.created_at or "", reverse=True)
    return memories


def clear_episodic_memory(user_id: str) -> int:
    """Delete all points for *user_id*; returns number of deleted points."""
    client = _get_client()
    result = client.delete(
        collection_name=settings.qdrant_collection,
        points_selector=qmodels.FilterSelector(
            filter=qmodels.Filter(
                must=[
                    qmodels.FieldCondition(
                        key="user_id",
                        match=qmodels.MatchValue(value=user_id),
                    )
                ]
            )
        ),
    )
    # Qdrant returns operation_id on success; count isn't directly exposed
    return 0  # Qdrant cloud doesn't return deleted count
