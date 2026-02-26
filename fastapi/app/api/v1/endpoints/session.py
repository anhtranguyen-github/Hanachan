from fastapi import APIRouter, HTTPException, Query
from typing import List
from ....schemas.session import (
    CreateSessionRequest, 
    CreateSessionResponse, 
    SessionInfo, 
    UpdateSessionRequest, 
    EndSessionResponse,
    SessionSummary
)
from ....services.memory import session_memory as sess_mem
from ....services.memory import episodic_memory as ep_mem

router = APIRouter()

@router.post("/session", response_model=CreateSessionResponse, tags=["Session"])
async def create_session(req: CreateSessionRequest):
    """
    Start a new conversation thread for a user.
    """
    session_id = sess_mem.create_session(req.user_id, req.metadata)
    s = sess_mem.get_session(session_id)
    return CreateSessionResponse(
        session_id=session_id,
        user_id=req.user_id,
        title=None,
        created_at=s["created_at"],
    )

@router.get("/session/{session_id}", tags=["Session"])
async def get_session(session_id: str):
    """Get full session info including all messages, title, and rolling summary."""
    info = sess_mem.to_session_info(session_id)
    if info is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return info

@router.get("/sessions/{user_id}", response_model=List[SessionSummary], tags=["Session"])
async def list_sessions(user_id: str):
    """List all active sessions for a user (summaries only, no message bodies)."""
    return sess_mem.list_sessions(user_id)

@router.patch("/session/{session_id}", tags=["Session"])
async def update_session(session_id: str, req: UpdateSessionRequest):
    """Manually update a session's title or metadata."""
    ok = sess_mem.update_session_meta(
        session_id, title=req.title, metadata=req.metadata
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    info = sess_mem.to_session_info(session_id)
    return info

@router.delete("/session/{session_id}", response_model=EndSessionResponse, tags=["Session"])
async def end_session(
    session_id: str,
    consolidate: bool = Query(
        True,
        description="If true, the full session transcript is written to long-term episodic memory.",
    ),
):
    """
    End a session (thread).
    """
    data = sess_mem.end_session(session_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Session not found")

    user_id = data["user_id"]

    if consolidate and data["messages"]:
        transcript = "\n".join(
            f"{m['role'].capitalize()}: {m['content']}"
            for m in data["messages"]
            if m["role"] != "system"
        )
        if transcript:
            summary_text = (
                f"[Session transcript] {data.get('summary') or transcript[:300]}"
            )
            ep_mem.add_episodic_memory(user_id, summary_text)

    return EndSessionResponse(
        session_id=session_id,
        user_id=user_id,
        title=data.get("title"),
        summary=data.get("summary"),
        message_count=len(data["messages"]),
        message="Session ended"
        + (" and consolidated into long-term memory." if consolidate else "."),
    )
