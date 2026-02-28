"""
Speaking Practice API Endpoints

These endpoints manage speaking practice sessions:
- Create a new practice session based on learned words
- Get next practice item with adaptive difficulty
- Record pronunciation attempts for adaptive feedback
"""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.concurrency import run_in_threadpool

from ....core.rate_limit import limiter
from ....core.config import settings

from ....schemas.speaking import (
    CreatePracticeSessionRequest,
    PracticeSessionResponse,
    NextPracticeItemResponse,
    RecordAttemptRequest,
    RecordAttemptResponse,
    PracticeStatsResponse,
    PracticeSentenceSchema,
)
from ....services import speaking_practice as sp_service
from ....core.database import execute_single
from ....core.security import require_auth

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/session", response_model=PracticeSessionResponse, tags=["Speaking"])
@limiter.limit("5/minute")
async def create_practice_session(
    request: Request,
    req: CreatePracticeSessionRequest,
    token: dict = Depends(require_auth),
):
    """
    Create a new speaking practice session in the database.
    """
    user_id = token.get("sub")
    
    # Create session using the service
    result = await run_in_threadpool(
        sp_service.create_practice_session,
        user_id,
        req.target_difficulty,
    )
    
    if not result.get("success"):
        return PracticeSessionResponse(
            success=False,
            session_id=None,
            sentences=[],
            difficulty=result.get("difficulty", "N5"),
            user_level=result.get("user_level", 1),
            total_sentences=0,
            error=result.get("error", "Failed to create session"),
        )
    
    return PracticeSessionResponse(
        success=True,
        session_id=result["session_id"],
        sentences=[
            PracticeSentenceSchema(**s) for s in result["sentences"]
        ],
        difficulty=result["difficulty"],
        user_level=result["user_level"],
        total_sentences=result["total_sentences"],
    )


@router.get("/session/{session_id}/next", response_model=NextPracticeItemResponse, tags=["Speaking"])
@limiter.limit("10/minute")
async def get_next_practice_item(
    request: Request,
    session_id: UUID,
    token: dict = Depends(require_auth),
):
    """
    Get the next sentence in the practice session from the database.
    """
    user_id = token.get("sub")
    
    # Get session from DB
    session_data = await run_in_threadpool(sp_service.get_session, session_id)
    if not session_data or session_data.get("status") != "active":
        raise HTTPException(status_code=404, detail="Active session not found")
    
    # Verify ownership
    if str(session_data.get("user_id")) != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    sentences = session_data.get("sentences", [])
    current_index = session_data.get("current_index", 0)
    
    if current_index >= len(sentences):
        return NextPracticeItemResponse(
            success=True,
            sentence=None,
            index=current_index,
            is_complete=True,
            feedback=None,
        )
    
    return NextPracticeItemResponse(
        success=True,
        sentence=PracticeSentenceSchema(**sentences[current_index]),
        index=current_index,
        is_complete=False,
        feedback=None,
    )


@router.post("/session/{session_id}/record", response_model=RecordAttemptResponse, tags=["Speaking"])
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def record_attempt(
    request: Request,
    session_id: UUID,
    req: RecordAttemptRequest,
    token: dict = Depends(require_auth),
):
    """
    Record a pronunciation attempt and update session state in the database.
    """
    user_id = token.get("sub")
    
    # Get session
    session_data = await run_in_threadpool(sp_service.get_session, session_id)
    if not session_data or session_data.get("status") != "active":
        raise HTTPException(status_code=404, detail="Active session not found")
    
    # Verify ownership
    if str(session_data.get("user_id")) != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Record the attempt in DB
    await run_in_threadpool(
        sp_service.record_practice_attempt,
        user_id,
        session_id,
        req.sentence,
        req.score,
        req.word,
    )
    
    # Fetch word attempts for adaptive logic (from attempts table)
    # Simple count for this session
    attempts_count = execute_single(
        "SELECT COUNT(*) as count FROM public.speaking_attempts WHERE session_id = %s AND word = %s",
        (session_id, req.word)
    )
    word_attempts = attempts_count["count"] if attempts_count else 1
    
    # Calculate adaptive feedback
    current_index = session_data.get("current_index", 0)
    current_difficulty = session_data.get("difficulty", "N5")
    
    adaptive = sp_service.calculate_adaptive_difficulty(
        current_difficulty,
        req.score,
        word_attempts,
    )
    
    # Update index based on adaptive logic
    next_index = current_index
    if not adaptive["should_repeat"]:
        next_index = current_index + 1
    
    # Update difficulty if advancing
    next_difficulty = current_difficulty
    if adaptive["next_action"] in ["advance", "mastered"]:
        next_difficulty = adaptive["next_difficulty"]
    
    # Persist state back to DB
    await run_in_threadpool(
        sp_service.update_session_state,
        session_id,
        next_index,
        next_difficulty
    )
    
    return RecordAttemptResponse(
        success=True,
        recorded=True,
    )


@router.get("/stats", response_model=PracticeStatsResponse, tags=["Speaking"])
@limiter.limit("5/minute")
async def get_practice_stats(
    request: Request,
    token: dict = Depends(require_auth),
):
    """
    Get the user's speaking practice statistics from the database.
    """
    user_id = token.get("sub")
    stats = await run_in_threadpool(sp_service.get_speaking_stats, user_id)
    return PracticeStatsResponse(**stats)


@router.delete("/session/{session_id}", tags=["Speaking"])
async def end_practice_session(
    session_id: UUID,
    token: dict = Depends(require_auth),
):
    """End a speaking practice session in the database."""
    user_id = token.get("sub")
    
    session_data = await run_in_threadpool(sp_service.get_session, session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if str(session_data.get("user_id")) != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Mark as abandoned or completed based on progress
    current_index = session_data.get("current_index", 0)
    total_sentences = session_data.get("total_sentences", 0)
    status = "completed" if current_index >= total_sentences else "abandoned"
    
    await run_in_threadpool(sp_service.end_session_db, session_id, status)
    
    return {
        "success": True,
        "message": f"Session {status}",
        "sentences_completed": current_index,
        "total_sentences": total_sentences,
    }
