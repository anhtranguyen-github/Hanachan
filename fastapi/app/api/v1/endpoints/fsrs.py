"""
FSRS API Endpoints
API for spaced repetition scheduling and review management.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException

from ....core.security import require_auth
from ....services.fsrs_service import get_fsrs_service, FSRSSchedule, FSRSReviewResult

router = APIRouter()


@router.get("/due")
async def get_due_items(
    item_type: Optional[str] = None,
    limit: int = 20,
    user: Dict[str, Any] = Depends(require_auth)
) -> Dict[str, Any]:
    """
    Get items due for review based on FSRS scheduling.
    
    Args:
        item_type: Optional filter by type ('ku', 'sentence', 'video')
        limit: Maximum number of items to return
    """
    service = get_fsrs_service()
    due_items = service.get_due_items(
        user_id=str(user["id"]),
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
    user: Dict[str, Any] = Depends(require_auth)
) -> Dict[str, Any]:
    """
    Get a summary of the user's learning state.
    Includes counts by type and state, plus items due today.
    """
    service = get_fsrs_service()
    summary = service.get_learning_summary(str(user["id"]))
    
    return summary


@router.get("/recommendation")
async def get_learning_recommendation(
    user: Dict[str, Any] = Depends(require_auth)
) -> Dict[str, Any]:
    """
    Get a recommendation for whether to teach new content or review.
    
    Returns:
        action: 'teach', 'review', or 'mixed'
        details: Reasoning and suggested counts
    """
    service = get_fsrs_service()
    action, details = service.should_teach_or_review(str(user["id"]))
    
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
    user: Dict[str, Any] = Depends(require_auth)
) -> Dict[str, Any]:
    """
    Submit a review rating for an item.
    
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
        user_id=str(user["id"]),
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
    user: Dict[str, Any] = Depends(require_auth)
) -> Dict[str, Any]:
    """
    Get review history for the user.
    
    Args:
        item_type: Optional filter by item type
        limit: Maximum number of logs to return
    """
    from ....core.database import execute_query
    
    query = """
        SELECT 
            item_id,
            item_type,
            facet,
            rating,
            state,
            stability,
            difficulty,
            interval_days,
            reviewed_at
        FROM public.fsrs_review_logs
        WHERE user_id = %s
    """
    params = [str(user["id"])]
    
    if item_type:
        query += " AND item_type = %s"
        params.append(item_type)
    
    query += " ORDER BY reviewed_at DESC LIMIT %s"
    params.append(limit)
    
    logs = execute_query(query, tuple(params))
    
    return {
        "logs": [dict(log) for log in logs],
        "total": len(logs)
    }
