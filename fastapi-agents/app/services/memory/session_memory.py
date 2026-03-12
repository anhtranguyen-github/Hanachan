"""
Session / Working Memory — Pure Agent Runtime version (calls fastapi-core).
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from app.core.core_client import CoreClient

logger = logging.getLogger(__name__)


async def create_session(jwt: str, user_id: str, metadata: dict[str, Any] | None = None) -> str:
    client = CoreClient(jwt)
    session_id = str(uuid.uuid4())
    # The core service handles creation
    result = await client.upsert_chat_session(session_id)
    return result.get("session_id") or session_id


async def get_session(jwt: str, session_id: str) -> dict[str, Any] | None:
    client = CoreClient(jwt)
    try:
        return await client.get_chat_session(session_id)
    except Exception:
        return None


async def list_sessions(jwt: str) -> list[Any]:
    client = CoreClient(jwt)
    return await client.list_chat_sessions()


async def get_messages(jwt: str, session_id: str) -> list[dict[str, str]]:
    client = CoreClient(jwt)
    return await client.get_chat_messages(session_id)


async def get_thread_context_text(jwt: str, session_id: str, last_n: int = 10) -> str:
    messages = await get_messages(jwt, session_id)
    recent = messages[-last_n:]
    lines = []
    for m in recent:
        prefix = "User" if m["role"] == "user" else "Assistant"
        lines.append(f"{prefix}: {m['content']}")
    return "\n".join(lines)
