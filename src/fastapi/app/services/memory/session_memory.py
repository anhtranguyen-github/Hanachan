"""Session / Working Memory backed directly by the merged app services."""

from __future__ import annotations

import logging
import uuid
from typing import Any

from app.auth.jwt import verify_supabase_jwt
from app.core.supabase import get_supabase_client
from app.domain.chat.services import ChatService

logger = logging.getLogger(__name__)


def _chat_service() -> ChatService:
    return ChatService(get_supabase_client())


async def _get_user_id(jwt: str) -> str:
    claims = await verify_supabase_jwt(jwt)
    user_id = claims.get("sub")
    if not user_id:
        raise ValueError("Invalid token: missing sub claim")
    return str(user_id)


async def create_session(_jwt: str, user_id: str, _metadata: dict[str, Any] | None = None) -> str:
    session_id = str(uuid.uuid4())
    result = await _chat_service().upsert_chat_session(user_id, session_id)
    return result.get("session_id") or session_id


async def get_session(jwt: str, session_id: str) -> dict[str, Any] | None:
    user_id = await _get_user_id(jwt)
    try:
        return await _chat_service().get_chat_session(user_id, session_id)
    except Exception:
        return None


async def list_sessions(jwt: str) -> list[Any]:
    user_id = await _get_user_id(jwt)
    return await _chat_service().list_chat_sessions(user_id)


async def get_messages(jwt: str, session_id: str) -> list[dict[str, str]]:
    user_id = await _get_user_id(jwt)
    return await _chat_service().get_chat_messages(user_id, session_id)


async def get_thread_context_text(jwt: str, session_id: str, last_n: int = 10) -> str:
    messages = await get_messages(jwt, session_id)
    recent = messages[-last_n:]
    lines = []
    for m in recent:
        prefix = "User" if m["role"] == "user" else "Assistant"
        lines.append(f"{prefix}: {m['content']}")
    return "\n".join(lines)
