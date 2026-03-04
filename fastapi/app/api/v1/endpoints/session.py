from __future__ import annotations
from typing import Any, Dict
from supabase import Client
from app.api.deps import get_current_user, get_user_client
from fastapi import Depends
"""
Session endpoints.
Fixes:
  Issue #1  — JWT authentication on all endpoints
  Issue #6  — run_in_threadpool for sync code
  Issue #17 — ownership checks on session resources

Architecture Note:
  Auth removed from FastAPI per architecture rules.
  FastAPI = Agents ONLY (stateless, no auth)
  Auth handled by Supabase/Next.js (BFF pattern)
  user_id passed in request body/query from trusted Next.js layer
"""

import logging
from typing import List
import uuid

from fastapi import APIRouter, HTTPException, Query
from fastapi.concurrency import run_in_threadpool

from app.schemas.session import (
    CreateSessionRequest,
    CreateSessionResponse,
    UpdateSessionRequest,
    EndSessionResponse,
    SessionSummary,
)
from app.services.memory import session_memory as sess_mem
from app.services.memory import episodic_memory as ep_mem

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
    user_id: str,
) -> dict:
    """Raise 403 if the session doesn't belong to the user.

    Architecture Note:
      user_id is passed from Next.js which validates auth via Supabase.
      FastAPI trusts the user_id from the trusted BFF layer.
    """
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
    request_user_id = _normalize_user_id(user_id)

    if session_user_id != request_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return s


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/session", response_model=CreateSessionResponse, tags=["Session"])
async def create_session(
    req: CreateSessionRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Start a new conversation thread for a user.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id in request body
      is trusted to have been validated by the BFF layer.
    """
    user_id = current_user["id"]
    # Ensure they only create a session for themselves
    if str(req.user_id) != str(user_id):
         raise HTTPException(status_code=400, detail="Invalid user_id in request body")
         
    session_id = await run_in_threadpool(
        sess_mem.create_session, user_id, req.metadata
    )
    s = await run_in_threadpool(sess_mem.get_session, session_id)
    return CreateSessionResponse(
        session_id=session_id,
        user_id=user_id,
        title=None,
        created_at=s["created_at"],
    )


@router.get("/session/{session_id}", tags=["Session"])
async def get_session(
    session_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Get full session info including all messages, title, and rolling summary."""
    user_id = current_user["id"]
    # Verify ownership
    await _assert_session_owner(session_id, user_id)

    info = await run_in_threadpool(sess_mem.to_session_info, session_id)
    if info is None:
        # Session was deleted between ownership check and here - treat as not found
        raise HTTPException(status_code=404, detail="Session not found")
    return info


@router.get(
    "/sessions", response_model=List[SessionSummary], tags=["Session"]
)
async def list_sessions(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """List all active sessions for a user (summaries only, no message bodies)."""
    user_id = current_user["id"]
    return await run_in_threadpool(sess_mem.list_sessions, user_id)


@router.patch("/session/{session_id}", tags=["Session"])
async def update_session(
    session_id: str,
    req: UpdateSessionRequest,
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Manually update a session's title or metadata."""
    user_id = current_user["id"]
    # Session ownership verified by _assert_session_owner
    await _assert_session_owner(session_id, user_id)

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
    current_user: Dict[str, Any] = Depends(get_current_user),
    consolidate: bool = Query(
        True,
        description="If true, the full session transcript is written to long-term episodic memory.",
    ),
):
    """End a session (thread)."""
    user_id = current_user["id"]
    # Session ownership verified by _assert_session_owner
    await _assert_session_owner(session_id, user_id)

    data = await run_in_threadpool(sess_mem.end_session, session_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Session not found")

    session_user_id = data["user_id"]

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
            await run_in_threadpool(ep_mem.add_episodic_memory, session_user_id, summary_text)

    return EndSessionResponse(
        session_id=session_id,
        user_id=session_user_id,
        title=data.get("title"),
        summary=data.get("summary"),
        message_count=len(data.get("messages", [])),
        message="Session ended"
        + (" and consolidated into long-term memory." if consolidate else "."),
    )
