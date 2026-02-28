"""
Speaking Practice API Endpoints

These endpoints manage speaking practice sessions:
- Create a new practice session based on learned words
- Get next practice item with adaptive difficulty
- Record pronunciation attempts for adaptive feedback
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool

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
from ....core.security import require_auth, require_own_user

logger = logging.getLogger(__name__)

router = APIRouter()


# In-memory session storage (in production, use Redis or database)
# Key: session_id, Value: session data dict
_practice_sessions: dict = {}


@router.post(
    "/practice/session", response_model=PracticeSessionResponse, tags=["Speaking"]
)
async def create_practice_session(
    req: CreatePracticeSessionRequest,
    token: dict = Depends(require_auth),
):
    """
    Create a new speaking practice session.

    This endpoint:
    1. Fetches the user's learned vocabulary
    2. Selects sentences containing those words
    3. Orders them by difficulty progression
    4. Returns a session with adaptive practice sentences
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
            difficulty=result.get("difficulty", "beginner"),
            user_level=result.get("user_level", 1),
            total_sentences=0,
            error=result.get("error", "Failed to create session"),
        )

    # Store session data for later reference
    session_id = result["session_id"]
    _practice_sessions[session_id] = {
        "user_id": user_id,
        "sentences": result["sentences"],
        "difficulty": result["difficulty"],
        "current_index": 0,
        "word_attempts": {},
        "word_scores": {},
    }

    return PracticeSessionResponse(
        success=True,
        session_id=session_id,
        sentences=[PracticeSentenceSchema(**s) for s in result["sentences"]],
        difficulty=result["difficulty"],
        user_level=result["user_level"],
        total_sentences=result["total_sentences"],
    )


@router.get(
    "/practice/session/{session_id}/next",
    response_model=NextPracticeItemResponse,
    tags=["Speaking"],
)
async def get_next_practice_item(
    session_id: str,
    token: dict = Depends(require_auth),
):
    """
    Get the next sentence in the practice session.

    Query parameters:
    - score: Optional score from last pronunciation (for adaptive logic)
    - word: Optional word that was just practiced
    """
    user_id = token.get("sub")

    # Get session
    session_data = _practice_sessions.get(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")

    # Verify ownership
    if session_data.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Get query parameters for adaptive feedback
    # Note: FastAPI will handle the query params below
    # But we'll get them from the request in the endpoint

    # For now, just return current item (adaptive logic handled separately)
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


@router.post(
    "/practice/session/{session_id}/record",
    response_model=RecordAttemptResponse,
    tags=["Speaking"],
)
async def record_attempt(
    session_id: str,
    req: RecordAttemptRequest,
    token: dict = Depends(require_auth),
):
    """
    Record a pronunciation attempt and get adaptive feedback.

    This endpoint:
    1. Records the attempt for analytics
    2. Calculates adaptive feedback based on score
    3. Returns next action (repeat, next, advance difficulty)
    """
    user_id = token.get("sub")

    # Get session
    session_data = _practice_sessions.get(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")

    # Verify ownership
    if session_data.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Record the attempt
    await run_in_threadpool(
        sp_service.record_practice_attempt,
        user_id,
        session_id,
        req.sentence,
        req.score,
        req.word,
    )

    # Update session state
    word = req.word
    word_attempts = session_data.get("word_attempts", {})
    word_attempts[word] = word_attempts.get(word, 0) + 1
    session_data["word_attempts"] = word_attempts

    # Calculate adaptive feedback
    current_index = session_data.get("current_index", 0)
    current_difficulty = session_data.get("difficulty", "beginner")

    adaptive = sp_service.calculate_adaptive_difficulty(
        current_difficulty,
        req.score,
        word_attempts.get(word, 0),
    )

    # Update index based on adaptive logic
    if adaptive["should_repeat"]:
        # Stay on current sentence
        pass
    else:
        # Move to next
        session_data["current_index"] = current_index + 1

    # Update difficulty if advancing
    if adaptive["next_action"] in ["advance", "mastered"]:
        session_data["difficulty"] = adaptive["next_difficulty"]

    _practice_sessions[session_id] = session_data

    return RecordAttemptResponse(
        success=True,
        recorded=True,
    )


@router.get("/practice/stats", response_model=PracticeStatsResponse, tags=["Speaking"])
async def get_practice_stats(
    token: dict = Depends(require_own_user),
):
    """
    Get the user's speaking practice statistics.

    Returns aggregate statistics about the user's practice history.
    """
    # TODO: Implement with actual database queries
    # For now, return empty stats
    return PracticeStatsResponse(
        total_sessions=0,
        total_attempts=0,
        average_score=0.0,
        words_practiced=0,
        current_streak=0,
    )


@router.delete("/practice/session/{session_id}", tags=["Speaking"])
async def end_practice_session(
    session_id: str,
    token: dict = Depends(require_auth),
):
    """End a speaking practice session."""
    user_id = token.get("sub")

    session_data = _practice_sessions.get(session_id)
    if not session_data:
        raise HTTPException(status_code=404, detail="Session not found")

    if session_data.get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Clean up session
    completed_index = session_data.get("current_index", 0)
    total_sentences = len(session_data.get("sentences", []))

    del _practice_sessions[session_id]

    return {
        "success": True,
        "message": "Session ended",
        "sentences_completed": completed_index,
        "total_sentences": total_sentences,
    }
