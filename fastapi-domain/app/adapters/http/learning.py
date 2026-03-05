import os

from fastapi import APIRouter, Depends
from supabase import Client, create_client

from app.adapters.supabase.learning_repo import LearningRepository
from app.auth.jwt import get_current_user_id
from app.domain.learning.models import KnowledgeUnit, KUStatus, Rating
from app.domain.learning.services import LearningService

router = APIRouter(prefix="/learning", tags=["learning"])


def get_learning_service() -> LearningService:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv(
        "SUPABASE_SERVICE_KEY"
    )  # We use service key for complex cross-item logic if needed, or anon
    client: Client = create_client(url, key)
    repo = LearningRepository(client)
    return LearningService(repo)


@router.get("/progress", response_model=KUStatus | None)
async def get_progress(
    identifier: str,
    user_id: str = Depends(get_current_user_id),
    service: LearningService = Depends(get_learning_service),
):
    return await service.get_ku_progress(user_id, identifier)


@router.get("/search", response_model=list[KnowledgeUnit])
async def search_ku(
    q: str, limit: int = 10, service: LearningService = Depends(get_learning_service)
):
    return await service.search_knowledge(q, limit)


@router.post("/review", response_model=KUStatus)
async def submit_review(
    ku_id: str,
    facet: str,
    rating: Rating,
    wrong_count: int = 0,
    user_id: str = Depends(get_current_user_id),
    service: LearningService = Depends(get_learning_service),
):
    return await service.submit_review(user_id, ku_id, facet, rating, wrong_count)


@router.post("/notes")
async def add_note(
    ku_id: str,
    note_content: str,
    user_id: str = Depends(get_current_user_id),
    service: LearningService = Depends(get_learning_service),
):
    await service.add_note(user_id, ku_id, note_content)
    return {"status": "success"}


@router.get("/recent-reviews", response_model=list[dict])
async def get_recent_reviews(
    limit: int = 5,
    user_id: str = Depends(get_current_user_id),
    service: LearningService = Depends(get_learning_service),
):
    # Dummy implementation for now to satisfy memory_agent
    # In real world, we'd fetch from logs
    return []
