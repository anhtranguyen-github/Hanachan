import os

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client, create_client

from app.adapters.supabase.reading_repo import SupabaseReadingRepository
from app.auth.jwt import get_current_user_id
from app.core.reading.errors import ReadingCoreError
from app.core.reading.models import AnswerResult, AnswerSubmission
from app.core.reading.services import ReadingService

router = APIRouter(prefix="/reading", tags=["reading"])


# Dependency injection for the service
def get_reading_service() -> ReadingService:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")  # RLS enforced, so anon key is fine
    client: Client = create_client(url, key)
    repo = SupabaseReadingRepository(client)
    return ReadingService(repo)


@router.post("/submit-answer", response_model=AnswerResult)
async def submit_reading_answer(
    submission: AnswerSubmission,
    user_id: str = Depends(get_current_user_id),
    service: ReadingService = Depends(get_reading_service),
):
    """
    THIN ROUTER:
    - Validates request body (via Pydantic)
    - Extracts user_id from JWT
    - Delegates core logic to Core Service
    """
    try:
        return await service.submit_answer(user_id, submission)
    except ReadingCoreError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        # Generic error handling
        raise HTTPException(status_code=500, detail="Internal server error")
