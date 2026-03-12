"""
Episodic Memory Module — backed by Qdrant (cloud).
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels
from app.core.config import settings
from app.core.llm import make_embedding_model
from app.schemas.memory import EpisodicMemory

# ---------------------------------------------------------------------------
# Singleton client, embedder, vector store
# ---------------------------------------------------------------------------

_client: QdrantClient | None = None
_embedder: OpenAIEmbeddings | None = None
_vectorstore: QdrantVectorStore | None = None


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
        _embedder = make_embedding_model()
    return _embedder


def _get_vectorstore() -> QdrantVectorStore:
    """Return a LangChain Qdrant vector store bound to our collection."""
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = QdrantVectorStore(
            client=_get_client(),
            collection_name=settings.qdrant_collection,
            embedding=_get_embedder(),
        )
    return _vectorstore


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
    vectorstore = _get_vectorstore()
    point_id = str(uuid.uuid4())
    created_at = datetime.now(UTC).isoformat()

    vectorstore.add_texts(
        texts=[text],
        metadatas=[{"id": point_id, "user_id": user_id, "created_at": created_at}],
        ids=[point_id],
    )
    return point_id


def search_episodic_memory(user_id: str, query: str, k: int = 3) -> list[EpisodicMemory]:
    """Similarity search restricted to *user_id*; returns top-k results."""
    vectorstore = _get_vectorstore()

    # Build a Qdrant filter
    qfilter = qmodels.Filter(
        must=[
            qmodels.FieldCondition(
                key="user_id",
                match=qmodels.MatchValue(value=user_id),
            )
        ]
    )

    hits = vectorstore.similarity_search_with_score(query, k=k, filter=qfilter)

    results: list[EpisodicMemory] = []
    for doc, score in hits:
        md = doc.metadata or {}
        results.append(
            EpisodicMemory(
                id=str(md.get("id") or ""),
                text=str(doc.page_content or ""),
                score=float(score) if score is not None else None,
                created_at=md.get("created_at"),
            )
        )
    return results


def list_episodic_memories(user_id: str, limit: int = 50) -> list[EpisodicMemory]:
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
    client.delete(
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
    return 0  # Qdrant cloud doesn't return deleted count


def delete_episodic_memory_by_id(memory_id: str) -> bool:
    """Delete a single episodic memory point by ID. Returns True if deleted."""
    client = _get_client()
    client.delete(
        collection_name=settings.qdrant_collection,
        points_selector=qmodels.PointIdsList(points=[memory_id]),
    )
    return True
