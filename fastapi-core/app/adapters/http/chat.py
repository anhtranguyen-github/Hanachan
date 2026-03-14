import os

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client, create_client

from app.core.config import settings
from app.auth.jwt import get_current_user_id
from app.core.services.chat_service import ChatService

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatMessagePayload(BaseModel):
    role: str
    content: str


class ChatSessionUpdatePayload(BaseModel):
    title: str | None = None
    summary: str | None = None


def get_chat_service() -> ChatService:
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_KEY
    client: Client = create_client(url, key)
    return ChatService(client)


@router.post("/sessions/{session_id}")
async def upsert_session(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
):
    return await service.upsert_chat_session(user_id, session_id)


@router.get("/sessions")
async def list_sessions(
    user_id: str = Depends(get_current_user_id), service: ChatService = Depends(get_chat_service)
):
    return await service.list_chat_sessions(user_id)


@router.get("/sessions/{session_id}")
async def get_session(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
):
    try:
        res = await service.get_chat_session(user_id, session_id)
        if not res:
            raise HTTPException(status_code=404, detail="Session not found")
        return res
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.patch("/sessions/{session_id}")
async def update_session(
    session_id: str,
    payload: ChatSessionUpdatePayload,
    user_id: str = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
):
    try:
        return await service.update_chat_session(user_id, session_id, payload.title, payload.summary)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
):
    try:
        return await service.delete_chat_session(user_id, session_id)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.post("/sessions/{session_id}/messages")
async def add_message(
    session_id: str,
    payload: ChatMessagePayload,
    user_id: str = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
):
    try:
        return await service.add_chat_message(user_id, session_id, payload.role, payload.content)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/sessions/{session_id}/messages")
async def get_messages(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    service: ChatService = Depends(get_chat_service),
):
    try:
        return await service.get_chat_messages(user_id, session_id)
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
