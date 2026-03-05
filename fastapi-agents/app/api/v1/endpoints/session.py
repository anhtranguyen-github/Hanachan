import logging
import uuid
from typing import Any

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.core.domain_client import DomainClient

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Session"])


@router.post("/session")
async def create_session(
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Proxy session creation to Domain Service."""
    client = DomainClient(current_user["jwt"])
    # Note: Domain should probably handle ID generation
    session_id = str(uuid.uuid4())
    return await client.upsert_chat_session(session_id)


@router.get("/sessions")
async def list_sessions(
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Proxy session listing to Domain Service."""
    client = DomainClient(current_user["jwt"])
    return await client.list_chat_sessions()


@router.get("/session/{session_id}")
async def get_session(
    session_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Proxy session detail to Domain Service."""
    client = DomainClient(current_user["jwt"])
    return await client.get_chat_session(session_id)


@router.delete("/session/{session_id}")
async def end_session(
    session_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Delete session via Domain Service."""
    client = DomainClient(current_user["jwt"])
    return await client.delete_chat_session(session_id)
