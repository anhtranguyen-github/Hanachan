import logging
import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict

from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.api.core_deps import get_chat_service
from app.domain.chat.services import ChatService

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Threads"])


class UpdateThreadRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str | None = None
    summary: str | None = None


@router.post("/thread")
async def create_thread(
    current_user: dict[str, Any] = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    """Create a new chat thread."""
    thread_id = str(uuid.uuid4())
    return await service.upsert_chat_session(current_user["id"], thread_id)


@router.get("/threads")
async def list_threads(
    current_user: dict[str, Any] = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    """List all user chat threads."""
    return await service.list_chat_sessions(current_user["id"])


@router.get("/thread/{thread_id}")
async def get_thread(
    thread_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    """Fetch a specific chat thread by ID."""
    return await service.get_chat_session(current_user["id"], thread_id)


@router.delete("/thread/{thread_id}")
async def delete_thread(
    thread_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    """Delete a chat thread and all its messages."""
    return await service.delete_chat_session(current_user["id"], thread_id)


@router.patch("/thread/{thread_id}")
async def update_thread(
    thread_id: str,
    req: UpdateThreadRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    """Update title/summary of a specific thread."""
    return await service.update_chat_session(
        current_user["id"], thread_id, title=req.title, summary=req.summary
    )


@router.get("/thread/{thread_id}/messages")
async def get_thread_messages(
    thread_id: str,
    limit: int = 50,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    """Retrieve message history for a specific thread."""
    return await service.get_chat_messages(current_user["id"], thread_id, limit=limit)


class AddMessageRequest(BaseModel):
    role: str
    content: str


@router.post("/thread/{thread_id}/messages")
async def add_thread_message(
    thread_id: str,
    req: AddMessageRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: ChatService = Depends(get_chat_service),
):
    """Manually add a message to a thread (rarely used, mostly for debugging)."""
    return await service.add_chat_message(
        current_user["id"], thread_id, role=req.role, content=req.content
    )
