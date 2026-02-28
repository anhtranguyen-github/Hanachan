"""
Video Dictation API Endpoints

These endpoints manage dictation practice sessions for video subtitles:
- Create a new dictation session for a video
- Submit dictation attempts
- Get session status and statistics
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from uuid import UUID

from ....core.rate_limit import limiter
from ....core.config import settings

from ....schemas.video_dictation import (
    CreateDictationSessionRequest,
    DictationSessionResponse,
    SubmitDictationAttemptRequest,
    SubmitDictationAttemptResponse,
    DictationSessionStatusResponse,
    DictationStatsResponse,
    DictationSubtitleItem,
    DictationAttemptResult,
)
from ....services import video_dictation as vd_service
from ....core.security import require_auth, require_own_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/session",
    response_model=DictationSessionResponse,
    tags=["Video Dictation"],
)
@limiter.limit("5/minute")
async def create_dictation_session(
    request: Request,
    req: CreateDictationSessionRequest,
    token: dict = Depends(require_auth),
):
    """
    Create a new dictation practice session for a video.
    
    This endpoint:
    1. Loads subtitles for the specified video
    2. Filters based on user settings (JLPT level, length, etc.)
    3. Creates a session for tracking progress
    4. Returns subtitles for dictation practice
    """
    user_id = token.get("sub")
    
    # Convert Pydantic settings to dict
    settings_dict = None
    if req.settings:
        settings_dict = req.settings.model_dump()
    
    result = await run_in_threadpool(
        vd_service.create_dictation_session,
        user_id,
        req.video_id,
        settings_dict,
    )
    
    if not result.get("success"):
        return DictationSessionResponse(
            success=False,
            session_id=None,
            video_id=req.video_id,
            subtitles=[],
            total_subtitles=0,
            error=result.get("error", "Failed to create session"),
        )
    
    # Convert subtitles to response format
    subtitles = [
        DictationSubtitleItem(**s) for s in result.get("subtitles", [])
    ]
    
    return DictationSessionResponse(
        success=True,
        session_id=result.get("session_id"),
        video_id=result.get("video_id"),
        subtitles=subtitles,
        total_subtitles=result.get("total_subtitles", 0),
    )


@router.post(
    "/session/{session_id}/attempt",
    response_model=SubmitDictationAttemptResponse,
    tags=["Video Dictation"],
)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def submit_dictation_attempt(
    request: Request,
    session_id: UUID,
    req: SubmitDictationAttemptRequest,
    token: dict = Depends(require_auth),
):
    """
    Submit a dictation attempt for a subtitle.
    
    This endpoint:
    1. Compares user input to the target subtitle text
    2. Calculates accuracy score
    3. Records the attempt in the database
    4. Returns feedback on the attempt
    """
    user_id = token.get("sub")
    
    result = await run_in_threadpool(
        vd_service.submit_dictation_attempt,
        user_id,
        session_id,
        req.subtitle_id,
        req.user_input,
        req.time_taken_ms,
    )
    
    if not result.get("success"):
        raise HTTPException(
            status_code=400,
            detail=result.get("error", "Failed to submit attempt"),
        )
    
    attempt_result = result.get("result")
    if attempt_result:
        # Remove internal timing fields from response
        attempt_result_response = DictationAttemptResult(
            subtitle_id=attempt_result.get("subtitle_id"),
            target_text=attempt_result.get("target_text"),
            user_input=attempt_result.get("user_input"),
            is_correct=attempt_result.get("is_correct"),
            accuracy_score=attempt_result.get("accuracy_score"),
            correct_chars=attempt_result.get("correct_chars"),
            total_chars=attempt_result.get("total_chars"),
        )
    else:
        attempt_result_response = None
    
    return SubmitDictationAttemptResponse(
        success=True,
        result=attempt_result_response,
        is_complete=result.get("is_complete", False),
        remaining=result.get("remaining", 0),
    )


@router.get(
    "/session/{session_id}/status",
    response_model=DictationSessionStatusResponse,
    tags=["Video Dictation"],
)
@limiter.limit("10/minute")
async def get_session_status(
    request: Request,
    session_id: UUID,
    token: dict = Depends(require_auth),
):
    """
    Get the current status of a dictation session.
    """
    user_id = token.get("sub")
    
    status = vd_service.get_session_status(user_id, session_id)
    
    if not status:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return DictationSessionStatusResponse(
        session_id=status.get("session_id"),
        video_id=status.get("video_id"),
        total_subtitles=status.get("total_subtitles"),
        completed_count=status.get("completed_count"),
        correct_count=status.get("correct_count"),
        accuracy_percent=status.get("accuracy_percent"),
        status=status.get("status"),
    )


@router.get(
    "/stats",
    response_model=DictationStatsResponse,
    tags=["Video Dictation"],
)
@limiter.limit("5/minute")
async def get_dictation_stats(
    request: Request,
    token: dict = Depends(require_auth),
):
    """
    Get the user's dictation practice statistics.
    """
    user_id = token.get("sub")
    
    stats = await run_in_threadpool(
        vd_service.get_dictation_stats,
        user_id,
    )
    
    return DictationStatsResponse(
        total_sessions=stats.get("total_sessions", 0),
        total_attempts=stats.get("total_attempts", 0),
        average_accuracy=stats.get("average_accuracy", 0.0),
        videos_practiced=stats.get("videos_practiced", 0),
        current_streak=stats.get("current_streak", 0),
        best_accuracy=stats.get("best_accuracy", 0),
    )


@router.delete(
    "/session/{session_id}",
    tags=["Video Dictation"],
)
async def end_dictation_session(
    session_id: UUID,
    token: dict = Depends(require_auth),
):
    """
    End/abandon a dictation session.
    """
    user_id = token.get("sub")
    
    # For now, just acknowledge the request
    # In production, would update session status in database
    return {
        "success": True,
        "message": "Session ended",
        "session_id": session_id,
    }
