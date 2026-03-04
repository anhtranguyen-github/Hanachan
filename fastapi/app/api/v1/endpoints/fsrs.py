"""
FSRS API Endpoints
API for spaced repetition scheduling and review management.

Architecture Note:
  Auth removed from FastAPI per architecture rules.
  FastAPI = Agents ONLY (stateless, no auth)
  Auth handled by Supabase/Next.js (BFF pattern)
  user_id passed in request body/query from trusted Next.js layer
"""

from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Query

from ....services.fsrs_service import get_fsrs_service

router = APIRouter()


@router.get("/due")
async def get_due_items(
    item_type: Optional[str] = None,
    limit: int = 20,
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
) -> Dict[str, Any]:
    """
    Get items due for review based on FSRS scheduling.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.

    Args:
        item_type: Optional filter by type ('ku', 'sentence', 'video')
        limit: Maximum number of items to return
    """
    service = get_fsrs_service()
    due_items = service.get_due_items(
        user_id=user_id,
        item_type=item_type,
        limit=limit
    )

    return {
        "items": [item.model_dump() for item in due_items],
        "total": len(due_items),
        "item_type_filter": item_type
    }


@router.get("/summary")
async def get_learning_summary(
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
) -> Dict[str, Any]:
    """
    Get a summary of the user's learning state.
    Includes counts by type and state, plus items due today.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.
    """
    service = get_fsrs_service()
    summary = service.get_learning_summary(user_id)

    return summary


@router.get("/recommendation")
async def get_learning_recommendation(
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
) -> Dict[str, Any]:
    """
    Get a recommendation for whether to teach new content or review.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.

    Returns:
        action: 'teach', 'review', or 'mixed'
        details: Reasoning and suggested counts
    """
    service = get_fsrs_service()
    action, details = service.should_teach_or_review(user_id)

    return {
        "action": action,
        "details": details,
        "timestamp": ""
    }


@router.post("/review/{item_type}/{item_id}")
async def submit_review(
    item_type: str,
    item_id: str,
    rating: int,
    facet: str = "meaning",
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
) -> Dict[str, Any]:
    """
    Submit a review rating for an item.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.

    Args:
        item_type: Type of item ('ku', 'sentence', 'video')
        item_id: ID of the item
        rating: Review rating (1=Again, 2=Hard, 3=Good, 4=Easy)
        facet: For KU items, the facet being reviewed (meaning, reading, cloze)

    Returns:
        Updated FSRS state with next review date
    """
    if rating not in [1, 2, 3, 4]:
        raise HTTPException(status_code=400, detail="Rating must be 1-4")

    if item_type not in ["ku", "sentence", "video"]:
        raise HTTPException(status_code=400, detail="Invalid item type")

    service = get_fsrs_service()
    result = service.submit_review(
        user_id=user_id,
        item_id=item_id,
        item_type=item_type,
        rating=rating,
        facet=facet
    )

    return {
        "success": True,
        "result": result.model_dump()
    }


@router.get("/review-logs")
async def get_review_logs(
    item_type: Optional[str] = None,
    limit: int = 50,
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
) -> Dict[str, Any]:
    """
    Get review history for the user.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.

    service = get_fsrs_service()
    logs = service.get_review_logs(
        user_id=user_id,
        item_type=item_type,
        limit=limit
    )

    return {
        "logs": logs or [],
        "total": len(logs) if logs else 0,
        "limit": limit
    }
