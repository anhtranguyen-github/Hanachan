"""
Session endpoints.
Fixes:
  Issue #1  — JWT authentication on all endpoints
  Issue #6  — run_in_threadpool for sync code
  Issue #17 — ownership checks on session resources
"""

from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.concurrency import run_in_threadpool
import uuid

from ....schemas.session import (
    CreateSessionRequest,
    CreateSessionResponse,
    UpdateSessionRequest,
    EndSessionResponse,
    SessionSummary,
)
from ....services.memory import session_memory as sess_mem
from ....services.memory import episodic_memory as ep_mem
from ....core.security import require_auth, require_own_user

logger = logging.getLogger(__name__)

router = APIRouter()


def _normalize_user_id(value: str) -> str:
    """Normalize user_id to a consistent string format for comparison.

    Handles UUID formats (with/without dashes) and string user IDs uniformly.
    """
    try:
        # Try to normalize as UUID (removes dashes)
        return str(uuid.UUID(value))
    except (ValueError, TypeError):
        # Not a UUID, return as-is (but warn for debugging)
        logger.debug("non_uuid_user_id", extra={"original": value})
        return value


async def _assert_session_owner(
    session_id: str,
    token: dict = Depends(require_auth),
) -> dict:
    """Raise 403 if the session doesn't belong to the authenticated user."""
    try:
        s = sess_mem.get_session(session_id)
    except Exception as exc:
        logger.error(
            "session_fetch_error", extra={"session_id": session_id, "error": str(exc)}
        )
        raise HTTPException(status_code=500, detail="Failed to fetch session")

    if s is None:
        raise HTTPException(status_code=404, detail="Session not found")

    # Normalize both IDs for comparison
    session_user_id = _normalize_user_id(str(s["user_id"]))
    token_sub = _normalize_user_id(token.get("sub", ""))

    if session_user_id != token_sub:
        raise HTTPException(status_code=403, detail="Forbidden")
    return s


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/session", response_model=CreateSessionResponse, tags=["Session"])
async def create_session(
    req: CreateSessionRequest,
    token: dict = Depends(require_auth),
):
    """Start a new conversation thread for a user."""
    # Ensure the user can only create sessions for themselves
    if req.user_id != token.get("sub"):
        raise HTTPException(status_code=403, detail="Forbidden")

    session_id = await run_in_threadpool(
        sess_mem.create_session, req.user_id, req.metadata
    )
    s = await run_in_threadpool(sess_mem.get_session, session_id)
    return CreateSessionResponse(
        session_id=session_id,
        user_id=req.user_id,
        title=None,
        created_at=s["created_at"],
    )


@router.get("/session/{session_id}", tags=["Session"])
async def get_session(
    session_id: str,
    s: dict = Depends(_assert_session_owner),
):
    """Get full session info including all messages, title, and rolling summary."""
    # Session already fetched and ownership verified by _assert_session_owner dependency
    # Use the returned session data to avoid TOCTOU race condition
    info = await run_in_threadpool(sess_mem.to_session_info, session_id)
    if info is None:
        # Session was deleted between ownership check and here - treat as not found
        raise HTTPException(status_code=404, detail="Session not found")
    return info


@router.get(
    "/sessions/{user_id}", response_model=List[SessionSummary], tags=["Session"]
)
async def list_sessions(
    user_id: str = Depends(require_own_user),
):
    """List all active sessions for a user (summaries only, no message bodies)."""
    return await run_in_threadpool(sess_mem.list_sessions, user_id)


@router.patch("/session/{session_id}", tags=["Session"])
async def update_session(
    session_id: str,
    req: UpdateSessionRequest,
    s: dict = Depends(_assert_session_owner),
):
    """Manually update a session's title or metadata."""
    # Session ownership already verified by _assert_session_owner dependency
    # Use returned session data 's' to avoid TOCTOU race condition
    ok = await run_in_threadpool(
        sess_mem.update_session_meta, session_id, req.title, req.metadata
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    info = await run_in_threadpool(sess_mem.to_session_info, session_id)
    return info


@router.delete(
    "/session/{session_id}", response_model=EndSessionResponse, tags=["Session"]
)
async def end_session(
    session_id: str,
    s: dict = Depends(_assert_session_owner),
    consolidate: bool = Query(
        True,
        description="If true, the full session transcript is written to long-term episodic memory.",
    ),
):
    """End a session (thread)."""
    data = await run_in_threadpool(sess_mem.end_session, session_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Session not found")

    user_id = data["user_id"]

    if consolidate and data.get("messages"):
        transcript = "\n".join(
            f"{m['role'].capitalize()}: {m['content']}"
            for m in data["messages"]
            if m["role"] != "system"
        )
        if transcript:
            summary_text = (
                f"[Session transcript] {data.get('summary') or transcript[:300]}"
            )
            await run_in_threadpool(ep_mem.add_episodic_memory, user_id, summary_text)

    return EndSessionResponse(
        session_id=session_id,
        user_id=user_id,
        title=data.get("title"),
        summary=data.get("summary"),
        message_count=len(data.get("messages", [])),
        message="Session ended"
        + (" and consolidated into long-term memory." if consolidate else "."),
    )
