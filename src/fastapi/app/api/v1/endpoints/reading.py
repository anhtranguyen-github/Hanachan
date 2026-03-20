from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.api.core_deps import get_reading_service
from app.api.deps import get_current_user
from app.domain.reading.errors import ReadingCoreError
from app.domain.reading.models import AnswerResult, AnswerSubmission
from app.domain.reading.services import ReadingService

router = APIRouter(prefix="/reading", tags=["Reading"])


@router.post("/submit-answer", response_model=AnswerResult)
async def submit_reading_answer(
    submission: AnswerSubmission,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: ReadingService = Depends(get_reading_service),
):
    try:
        return await service.submit_answer(current_user["id"], submission)
    except ReadingCoreError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Internal server error")
