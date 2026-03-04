"""
Sentence Library API Endpoints
API for managing user's personal sentence collection.

Architecture Note:
  Auth removed from FastAPI per architecture rules.
  FastAPI = Agents ONLY (stateless, no auth)
  Auth handled by Supabase/Next.js (BFF pattern)
  user_id passed in request body/query from trusted Next.js layer
"""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import require_auth
from pydantic import BaseModel, Field

from app.services.sentence_library import (
    get_sentence_library_service,
    SentenceCreate,
)

router = APIRouter()
logger = logging.getLogger(__name__)


class SentenceCreateRequest(BaseModel):
    """Request model for creating a sentence."""
    japanese: str
    english: str
    furigana: Optional[str] = None
    romaji: Optional[str] = None
    source_type: str = "manual"
    source_id: Optional[str] = None
    source_timestamp: Optional[int] = None
    jlpt_level: Optional[int] = Field(None, ge=1, le=5)
    tags: List[str] = Field(default_factory=list)
    category: str = "general"
    notes: Optional[str] = None


class SentenceUpdateRequest(BaseModel):
    """Request model for updating a sentence."""
    japanese: Optional[str] = None
    english: Optional[str] = None
    furigana: Optional[str] = None
    romaji: Optional[str] = None
    jlpt_level: Optional[int] = Field(None, ge=1, le=5)
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    is_favorite: Optional[bool] = None
    notes: Optional[str] = None


@router.post("/", response_model=Dict[str, Any])
async def create_sentence(
    request: SentenceCreateRequest,
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
) -> Dict[str, Any]:
    """
    Create a new sentence in the user's library.
    Automatically analyzes the sentence for tokens, grammar, and difficulty.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.
    """
    service = get_sentence_library_service()

    sentence_data = SentenceCreate(
        japanese=request.japanese,
        english=request.english,
        furigana=request.furigana,
        romaji=request.romaji,
        source_type=request.source_type,
        source_id=request.source_id,
        source_timestamp=request.source_timestamp,
        jlpt_level=request.jlpt_level,
        tags=request.tags,
        category=request.category,
        notes=request.notes
    )

    try:
        sentence = service.create_sentence(
            user_id=user_id,
            data=sentence_data,
            auto_analyze=True
        )

        return {
            "success": True,
            "sentence": sentence.model_dump()
        }
    except Exception as e:
        logger.error(f"Failed to create sentence for user {user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create sentence")


@router.get("/")
async def list_sentences(
    category: Optional[str] = None,
    jlpt_level: Optional[int] = Query(None, ge=1, le=5),
    is_favorite: Optional[bool] = None,
    source_type: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
) -> Dict[str, Any]:
    """
    List sentences in the user's library with optional filters.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.
    """
    service = get_sentence_library_service()

    sentences, total = service.list_sentences(
        user_id=user_id,
        category=category,
        jlpt_level=jlpt_level,
        is_favorite=is_favorite,
        source_type=source_type,
        search_query=search,
        limit=limit,
        offset=offset
    )

    return {
        "sentences": [s.model_dump() for s in sentences],
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("/search")
async def search_sentences(
    query: str,
    semantic: bool = True,
    min_similarity: float = Query(0.6, ge=0.0, le=1.0),
    limit: int = Query(10, ge=1, le=50),
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
) -> Dict[str, Any]:
    """
    Search sentences by semantic similarity or text match.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.

    Args:
        query: Search query (Japanese, English, or meaning description)
        semantic: If True, uses AI embeddings for meaning-based search
        min_similarity: Minimum similarity score for semantic search
        limit: Maximum results
    """
    service = get_sentence_library_service()

    if semantic:
        results = service.semantic_search(
            user_id=user_id,
            query=query,
            limit=limit,
            min_similarity=min_similarity
        )

        return {
            "results": [
                {
                    "sentence": r.sentence.model_dump(),
                    "similarity_score": r.similarity_score
                }
                for r in results
            ],
            "search_type": "semantic",
            "query": query
        }
    else:
        sentences, total = service.list_sentences(
            user_id=user_id,
            search_query=query,
            limit=limit
        )

        return {
            "results": [s.model_dump() for s in sentences],
            "total": total,
            "search_type": "text",
            "query": query
        }


@router.get("/{sentence_id}")
async def get_sentence(
    sentence_id: str,
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
) -> Dict[str, Any]:
    """
    Get a specific sentence by ID.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.
    """
    service = get_sentence_library_service()
    sentence = service.get_sentence(sentence_id, user_id)

    if not sentence:
        raise HTTPException(status_code=404, detail="Sentence not found")

    return {
        "sentence": sentence.model_dump()
    }


@router.patch("/{sentence_id}")
async def update_sentence(
    sentence_id: str,
    request: SentenceUpdateRequest,
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
) -> Dict[str, Any]:
    """
    Update a sentence's properties.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.
    """
    service = get_sentence_library_service()

    # Build updates dict from non-None fields
    updates = {}
    for field, value in request.model_dump(exclude_unset=True).items():
        if value is not None:
            updates[field] = value

    sentence = service.update_sentence(sentence_id, user_id, updates)

    if not sentence:
        raise HTTPException(status_code=404, detail="Sentence not found")

    return {
        "success": True,
        "sentence": sentence.model_dump()
    }


@router.delete("/{sentence_id}")
async def delete_sentence(
    sentence_id: str,
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
) -> Dict[str, Any]:
    """
    Delete a sentence from the library.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.
    """
    service = get_sentence_library_service()
    success = service.delete_sentence(sentence_id, user_id)

    if not success:
        raise HTTPException(status_code=404, detail="Sentence not found")

    return {
        "success": True,
        "message": "Sentence deleted"
    }


@router.post("/{sentence_id}/review")
async def submit_sentence_review(
    sentence_id: str,
    rating: int = Query(..., ge=1, le=4),
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
) -> Dict[str, Any]:
    """
    Submit a review rating for a sentence.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.

    Args:
        rating: 1=Again (forgot), 2=Hard, 3=Good, 4=Easy
    """
    from app.services.fsrs_service import get_fsrs_service

    if rating not in [1, 2, 3, 4]:
        raise HTTPException(status_code=400, detail="Rating must be 1-4")

    service = get_fsrs_service()
    result = service.submit_review(
        user_id=user_id,
        item_id=sentence_id,
        item_type="sentence",
        rating=rating,
        facet="meaning"
    )

    return {
        "success": True,
        "result": result.model_dump()
    }


@router.get("/{sentence_id}/analysis")
async def analyze_sentence(
    sentence_id: str,
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
) -> Dict[str, Any]:
    """
    Get detailed analysis for a sentence.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.
    """
    service = get_sentence_library_service()

    # First get the sentence
    sentence = service.get_sentence(sentence_id, user_id)
    if not sentence:
        raise HTTPException(status_code=404, detail="Sentence not found")

    # Analyze it
    analysis = service.analyze_sentence(sentence.japanese, user_id)

    return {
        "sentence_id": sentence_id,
        "analysis": analysis.model_dump()
    }


@router.get("/reviews/due")
async def get_due_reviews(
    limit: int = Query(10, ge=1, le=50),
    user: Dict[str, Any] = Depends(require_auth)
) -> Dict[str, Any]:
    """
    Get sentences that are due for review based on FSRS schedule.
    """
    service = get_sentence_library_service()
    sentences = service.get_sentences_for_review(str(user["id"]), limit=limit)
    
    return {
        "sentences": [s.model_dump() for s in sentences],
        "total_due": len(sentences)
    }


@router.post("/analyze-text")
async def analyze_text(
    text: str,
    user: Dict[str, Any] = Depends(require_auth)
) -> Dict[str, Any]:
    """
    Analyze a Japanese text without saving it.
    Returns tokenization, JLPT level, grammar detection, etc.
    """
    service = get_sentence_library_service()
    analysis = service.analyze_sentence(text, str(user["id"]))
    
    return {
        "analysis": analysis.model_dump()
    }
