import logging
import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.core.core_client import CoreClient

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Session"])


class UpdateSessionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = None
    summary: str | None = None


@router.post("/session")
async def create_session(
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Proxy session creation to Core Service."""
    client = CoreClient(current_user["jwt"])
    # Note: Core should probably handle ID generation
    session_id = str(uuid.uuid4())
    return await client.upsert_chat_session(session_id)


@router.get("/sessions")
async def list_sessions(
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Proxy session listing to Core Service."""
    client = CoreClient(current_user["jwt"])
    return await client.list_chat_sessions()


@router.get("/session/{session_id}")
async def get_session(
    session_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Proxy session detail to Core Service."""
    client = CoreClient(current_user["jwt"])
    return await client.get_chat_session(session_id)


@router.delete("/session/{session_id}")
async def end_session(
    session_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Delete session via Core Service."""
    client = CoreClient(current_user["jwt"])
    return await client.delete_chat_session(session_id)


@router.patch("/session/{session_id}")
async def update_session(
    session_id: str,
    req: UpdateSessionRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Update session title/summary via Core Service."""
    client = CoreClient(current_user["jwt"])
    return await client.update_chat_session(session_id, title=req.title, summary=req.summary)
