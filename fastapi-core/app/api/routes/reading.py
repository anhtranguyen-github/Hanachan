from typing import Any
from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user, get_reading_service
from app.models.reading import AnswerSubmission, AnswerResult
from app.services.reading import ReadingService

router = APIRouter(prefix="/reading", tags=["Reading"])

@router.post("/submit-answer", response_model=AnswerResult)
async def submit_reading_answer(
    submission: AnswerSubmission,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: ReadingService = Depends(get_reading_service),
):
    """
    Submit an answer for a reading exercise.
    Logic is delegated to ReadingService.
    """
    return await service.submit_answer(user_id=current_user["sub"], submission=submission)
