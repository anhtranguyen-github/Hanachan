"""
LangChain Qdrant Vector Store Service — Cloud integration.

This module provides LangChain-compatible Qdrant integration for:
- Document storage and retrieval
- Semantic search with embeddings
- Similarity search with scores
- MMR (Maximal Marginal Relevance) search

Uses Qdrant Cloud with API key authentication.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional, Tuple

from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_openai import OpenAIEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from ..core.config import settings
from ..core.llm import make_embedding_model

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Singleton instances
# ---------------------------------------------------------------------------

_client: QdrantClient | None = None
_embedder: OpenAIEmbeddings | None = None
_vector_store: QdrantVectorStore | None = None


# ---------------------------------------------------------------------------
# Client initialization
# ---------------------------------------------------------------------------

def _get_client() -> QdrantClient:
    """Get or create Qdrant client with cloud credentials."""
    global _client
    if _client is None:
        _client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key,
            timeout=30,
        )
    return _client


def _get_embedder() -> OpenAIEmbeddings:
    """Get or create embedding model."""
    global _embedder
    if _embedder is None:
        _embedder = make_embedding_model()
    return _embedder


def _get_vector_store() -> QdrantVectorStore:
    """Get or create LangChain QdrantVectorStore."""
    global _vector_store
    if _vector_store is None:
        client = _get_client()
        embedder = _get_embedder()
        
        _vector_store = QdrantVectorStore(
            client=client,
            collection_name=settings.qdrant_collection,
            embedding=embedder,
        )
    return _vector_store


# ---------------------------------------------------------------------------
# Collection management
# ---------------------------------------------------------------------------

def init_collection() -> None:
    """Create the collection if it doesn't exist."""
    client = _get_client()
    embedder = _get_embedder()
    
    existing = {c.name for c in client.get_collections().collections}
    
    if settings.qdrant_collection not in existing:
        logger.info(f"Creating Qdrant collection: {settings.qdrant_collection}")
        client.create_collection(
            collection_name=settings.qdrant_collection,
            vectors_config=qmodels.VectorParams(
                size=settings.embedding_dimensions,
                distance=qmodels.Distance.COSINE,
            ),
        )
        # Create payload indexes for common filters
        client.create_payload_index(
            collection_name=settings.qdrant_collection,
            field_name="metadata.user_id",
            field_schema=qmodels.PayloadSchemaType.KEYWORD,
        )
        logger.info(f"Created collection and indexes")
    else:
        logger.debug(f"Collection {settings.qdrant_collection} already exists")


def delete_collection() -> None:
    """Delete the collection (use with caution)."""
    client = _get_client()
    client.delete_collection(settings.qdrant_collection)
    logger.info(f"Deleted collection: {settings.qdrant_collection}")


def collection_info() -> Dict[str, Any]:
    """Get collection information."""
    client = _get_client()
    info = client.get_collection(settings.qdrant_collection)
    # Convert to dict using the model's dict method if available
    if hasattr(info, 'dict'):
        return info.dict()
    # Fallback: return basic info
    return {
        "collection": settings.qdrant_collection,
        "status": str(getattr(info, 'status', 'unknown')),
        "exists": True,
    }


# ---------------------------------------------------------------------------
# Document operations
# ---------------------------------------------------------------------------

def add_documents(
    documents: List[Document],
    ids: Optional[List[str]] = None,
) -> List[str]:
    """Add documents to the vector store.
    
    Args:
        documents: List of LangChain Document objects
        ids: Optional list of IDs for the documents
        
    Returns:
        List of document IDs
    """
    store = _get_vector_store()
    return store.add_documents(documents, ids=ids)


def add_texts(
    texts: List[str],
    metadatas: Optional[List[Dict[str, Any]]] = None,
    ids: Optional[List[str]] = None,
) -> List[str]:
    """Add texts with optional metadata to the vector store.
    
    Args:
        texts: List of text strings
        metadatas: Optional list of metadata dictionaries
        ids: Optional list of IDs
        
    Returns:
        List of document IDs
    """
    store = _get_vector_store()
    return store.add_texts(texts, metadatas=metadatas, ids=ids)


# ---------------------------------------------------------------------------
# Search operations
# ---------------------------------------------------------------------------

def similarity_search(
    query: str,
    k: int = 4,
    filter: Optional[Dict[str, Any]] = None,
) -> List[Document]:
    """Search for similar documents.
    
    Args:
        query: Search query text
        k: Number of results to return
        filter: Optional Qdrant filter dictionary
        
    Returns:
        List of matching Document objects
    """
    store = _get_vector_store()
    return store.similarity_search(query, k=k, filter=filter)


def similarity_search_with_score(
    query: str,
    k: int = 4,
    filter: Optional[Dict[str, Any]] = None,
) -> List[Tuple[Document, float]]:
    """Search for similar documents with relevance scores.
    
    Args:
        query: Search query text
        k: Number of results to return
        filter: Optional Qdrant filter dictionary
        
    Returns:
        List of (Document, score) tuples
    """
    store = _get_vector_store()
    return store.similarity_search_with_score(query, k=k, filter=filter)


def max_marginal_relevance_search(
    query: str,
    k: int = 4,
    fetch_k: int = 20,
    lambda_mult: float = 0.5,
    filter: Optional[Dict[str, Any]] = None,
) -> List[Document]:
    """Search with Maximal Marginal Relevance for diverse results.
    
    Args:
        query: Search query text
        k: Number of results to return
        fetch_k: Number of documents to fetch initially
        lambda_mult: Balance between relevance (1.0) and diversity (0.0)
        filter: Optional Qdrant filter dictionary
        
    Returns:
        List of diverse Document objects
    """
    store = _get_vector_store()
    return store.max_marginal_relevance_search(
        query, k=k, fetch_k=fetch_k, lambda_mult=lambda_mult, filter=filter
    )


# ---------------------------------------------------------------------------
# Retrieval interface (for LangChain chains/agents)
# ---------------------------------------------------------------------------

def as_retriever(search_kwargs: Optional[Dict[str, Any]] = None):
    """Get the vector store as a LangChain retriever.
    
    Args:
        search_kwargs: Optional search configuration
        
    Returns:
        VectorStoreRetriever instance
    """
    store = _get_vector_store()
    return store.as_retriever(search_kwargs=search_kwargs)


# ---------------------------------------------------------------------------
# Point operations
# ---------------------------------------------------------------------------

def delete_points(point_ids: List[str]) -> None:
    """Delete points by their IDs.
    
    Args:
        point_ids: List of point IDs to delete
    """
    client = _get_client()
    client.delete(
        collection_name=settings.qdrant_collection,
        points_selector=qmodels.PointIdsList(points=point_ids),
    )
    logger.info(f"Deleted {len(point_ids)} points")


def delete_by_filter(filter: qmodels.Filter) -> None:
    """Delete points matching a filter.
    
    Args:
        filter: Qdrant filter object
    """
    client = _get_client()
    client.delete(
        collection_name=settings.qdrant_collection,
        points_selector=qmodels.FilterSelector(filter=filter),
    )
    logger.info("Deleted points by filter")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

def health_check() -> str:
    """Check Qdrant connection health.
    
    Returns:
        'ok' if healthy, error message otherwise
    """
    try:
        client = _get_client()
        client.get_collections()
        return "ok"
    except Exception as exc:
        logger.error(f"Qdrant health check failed: {exc}")
        return f"error: {exc}"


# ---------------------------------------------------------------------------
# Utility functions
# ---------------------------------------------------------------------------

def scroll_points(
    batch_size: int = 100,
    filter: Optional[qmodels.Filter] = None,
) -> List[qmodels.Record]:
    """Scroll through all points in the collection.
    
    Args:
        batch_size: Number of points per batch
        filter: Optional filter
        
    Returns:
        List of records
    """
    client = _get_client()
    records = []
    offset = None
    
    while True:
        batch, offset = client.scroll(
            collection_name=settings.qdrant_collection,
            scroll_filter=filter,
            limit=batch_size,
            offset=offset,
        )
        records.extend(batch)
        if offset is None:
            break
    
    return records


def count_points(filter: Optional[qmodels.Filter] = None) -> int:
    """Count points in the collection.
    
    Args:
        filter: Optional filter
        
    Returns:
        Number of points
    """
    client = _get_client()
    result = client.count(
        collection_name=settings.qdrant_collection,
        count_filter=filter,
    )
    return result.count
