from typing import Any

from fastapi import APIRouter, Depends, Query

from app.api.core_deps import get_learning_service
from app.api.deps import get_current_user
from app.domain.learning.models import DashboardStats, KUStatus, KnowledgeUnit, NoteSubmission, ReviewSubmission
from app.domain.learning.services import LearningService

router = APIRouter(prefix="/learning", tags=["Learning"])


@router.get("/dashboard", response_model=DashboardStats)
async def get_learning_dashboard(
    deck_id: str | None = Query(None),
    current_user: dict[str, Any] = Depends(get_current_user),
    service: LearningService = Depends(get_learning_service),
):
    return await service.get_dashboard_stats(user_id=current_user["id"], deck_id=deck_id)


@router.get("/progress", response_model=KUStatus | None)
async def get_learning_progress(
    identifier: str,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: LearningService = Depends(get_learning_service),
):
    return await service.get_ku_progress(user_id=current_user["id"], identifier=identifier)


@router.get("/search", response_model=list[KnowledgeUnit])
async def search_knowledge(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    service: LearningService = Depends(get_learning_service),
):
    return await service.search_knowledge(query=q, limit=limit)


@router.post("/review", response_model=KUStatus)
async def submit_review(
    submission: ReviewSubmission,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: LearningService = Depends(get_learning_service),
):
    return await service.submit_review(
        user_id=current_user["id"],
        ku_id=submission.ku_id,
        facet=submission.facet,
        rating=submission.rating,
        wrong_count=submission.wrong_count,
    )


@router.post("/notes")
async def add_ku_note(
    submission: NoteSubmission,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: LearningService = Depends(get_learning_service),
):
    await service.add_note(
        user_id=current_user["id"],
        ku_id=submission.ku_id,
        note_content=submission.note_content,
    )
    return {"status": "success"}


@router.post("/decks/{deck_id}/toggle")
async def toggle_deck(
    deck_id: str,
    payload: dict[str, bool],
    current_user: dict[str, Any] = Depends(get_current_user),
    service: LearningService = Depends(get_learning_service),
):
    enabled = bool(payload.get("enabled", False))
    return await service.toggle_deck(current_user["id"], deck_id, enabled)
