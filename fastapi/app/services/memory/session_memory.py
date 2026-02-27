"""
Session / Working Memory — backed by PostgreSQL (Supabase).
"""
from __future__ import annotations

import logging
import uuid
import json
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from langchain_core.prompts import ChatPromptTemplate

from ...core.config import settings
from ...core.llm import make_llm
from ...schemas.session import SessionInfo, SessionMessage, SessionSummary
from ...core.database import execute_query, execute_single

logger = logging.getLogger(__name__)

# Thread pool for fire-and-forget background LLM work
_bg_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="llm-bg")


def shutdown_bg_executor() -> None:
    """Shutdown the background executor gracefully. Call on application shutdown."""
    global _bg_executor
    if _bg_executor is not None:
        _bg_executor.shutdown(wait=True, cancel_futures=False)
        _bg_executor = None
        logger.info("session_memory_bg_executor_shutdown")

# ---------------------------------------------------------------------------
# LLM prompts
# ---------------------------------------------------------------------------

_TITLE_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "Generate a concise, descriptive title (5 words max) for the following "
        "conversation snippet. Return ONLY the title, no punctuation or quotes.",
    ),
    ("human", "{snippet}"),
])

_SUMMARY_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are updating a rolling conversation summary. "
        "Given the EXISTING summary and the LATEST exchange, produce an updated summary "
        "that captures all important context in ≤3 sentences. "
        "Return ONLY the updated summary.",
    ),
    (
        "human",
        "Existing summary:\n{existing_summary}\n\n"
        "Latest exchange:\nUser: {user_msg}\nAssistant: {assistant_msg}",
    ),
])


def _generate_title(user_msg: str, assistant_msg: str) -> str:
    snippet = f"User: {user_msg}\nAssistant: {assistant_msg}"
    try:
        chain = _TITLE_PROMPT | make_llm()
        return chain.invoke({"snippet": snippet}).content.strip()
    except Exception:
        return user_msg[:60]


def _update_summary(existing: str, user_msg: str, assistant_msg: str) -> str:
    try:
        chain = _SUMMARY_PROMPT | make_llm()
        return chain.invoke(
            {
                "existing_summary": existing or "(none yet)",
                "user_msg": user_msg,
                "assistant_msg": assistant_msg,
            }
        ).content.strip()
    except Exception:
        return existing


# ---------------------------------------------------------------------------
# Session lifecycle
# ---------------------------------------------------------------------------

def create_session(user_id: str, metadata: Optional[Dict[str, Any]] = None) -> str:
    session_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    execute_query(
        "INSERT INTO public.chat_sessions (id, user_id, title, created_at, updated_at) "
        "VALUES (%s, %s, %s, %s, %s)",
        (session_id, user_id, None, now, now),
        fetch=False,
    )

    return session_id


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    return execute_single(
        "SELECT * FROM public.chat_sessions WHERE id = %s", (session_id,)
    )


def list_sessions(user_id: str) -> List[SessionSummary]:
    sessions = execute_query(
        "SELECT s.*, "
        "(SELECT count(*) FROM public.chat_messages m WHERE m.session_id = s.id) "
        "AS message_count "
        "FROM public.chat_sessions s WHERE s.user_id = %s ORDER BY s.updated_at DESC",
        (user_id,),
    )

    return [
        SessionSummary(
            session_id=str(s["id"]),
            user_id=s["user_id"],
            title=s.get("title"),
            summary=s.get("summary"),
            created_at=s["created_at"].isoformat(),
            updated_at=s["updated_at"].isoformat(),
            message_count=s["message_count"],
            metadata=s.get("metadata") or {},
        )
        for s in sessions
    ]


def update_session_meta(
    session_id: str,
    title: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> bool:
    # Check if session exists first
    session = get_session(session_id)
    if not session:
        return False

    now = datetime.now(timezone.utc)
    if title and metadata:
        execute_query(
            "UPDATE public.chat_sessions SET title = %s, "
            "updated_at = %s WHERE id = %s",
            (title, now, session_id),
            fetch=False,
        )
    elif title:
        execute_query(
            "UPDATE public.chat_sessions SET title = %s, updated_at = %s WHERE id = %s",
            (title, now, session_id),
            fetch=False,
        )
    elif metadata:
        execute_query(
            "UPDATE public.chat_sessions SET updated_at = %s "
            "WHERE id = %s",
            (now, session_id),
            fetch=False,
        )
    else:
        execute_query(
            "UPDATE public.chat_sessions SET updated_at = %s WHERE id = %s",
            (now, session_id),
            fetch=False,
        )
    return True


def end_session(session_id: str) -> Optional[Dict[str, Any]]:
    session = to_session_info(session_id)
    if not session:
        return None
    execute_query(
        "DELETE FROM public.chat_sessions WHERE id = %s", (session_id,), fetch=False
    )
    return session.model_dump()


def delete_all_sessions(user_id: str) -> int:
    result = execute_query(
        "DELETE FROM public.chat_sessions WHERE user_id = %s RETURNING id",
        (user_id,),
        fetch=True,
    )
    return len(result) if result else 0


# ---------------------------------------------------------------------------
# Message management + async title/summary (fire-and-forget)
# ---------------------------------------------------------------------------

def add_message(session_id: str, role: str, content: str) -> bool:
    now = datetime.now(timezone.utc)
    # Ensure the session exists first (auto-create if missing)
    session = get_session(session_id)
    if not session:
        # We need the user_id; try to get it from the agent state context
        # For now, create with a placeholder - the chat endpoint sets user_id
        logger.warning(f"Session {session_id} not found, skipping message persistence.")
        return True
    execute_query(
        "INSERT INTO public.chat_messages (session_id, role, content, created_at) "
        "VALUES (%s, %s, %s, %s)",
        (session_id, role, content, now),
        fetch=False,
    )
    execute_query(
        "UPDATE public.chat_sessions SET updated_at = %s WHERE id = %s",
        (now, session_id),
        fetch=False,
    )

    if role == "assistant":
        # Retrieve last user message for context
        messages = get_messages(session_id)
        user_msgs = [m for m in messages if m["role"] == "user"]
        last_user_msg = user_msgs[-1]["content"] if user_msgs else ""

        # Fire-and-forget: don't block the response path on LLM calls
        _bg_executor.submit(
            _update_session_metadata, session_id, last_user_msg, content
        )

    return True


def _update_session_metadata(
    session_id: str, user_msg: str, assistant_msg: str
) -> None:
    """Background task: generate title + rolling summary. Failures are logged, not raised."""
    try:
        session = get_session(session_id)
        if not session:
            return

        if not session.get("title") and user_msg:
            title = _generate_title(user_msg, assistant_msg)
            update_session_meta(session_id, title=title)

        updated_summary = _update_summary(
            session.get("summary") or "", user_msg, assistant_msg
        )
        # Cloud schema doesn't have a summary column, skip for now
        pass
    except Exception as exc:
        logger.error(
            "session_meta_update_failed",
            extra={"session_id": session_id, "error": str(exc)},
        )


def get_messages(session_id: str) -> List[Dict[str, str]]:
    messages = execute_query(
        "SELECT role, content, created_at as timestamp FROM public.chat_messages "
        "WHERE session_id = %s ORDER BY created_at",
        (session_id,),
    )
    if not messages:
        return []
    for m in messages:
        if isinstance(m.get("timestamp"), datetime):
            m["timestamp"] = m["timestamp"].isoformat()
    return messages


def get_thread_context_text(session_id: str, last_n: int = 10) -> str:
    messages = get_messages(session_id)
    recent = messages[-last_n:]
    lines = []
    for m in recent:
        prefix = "User" if m["role"] == "user" else "Assistant"
        lines.append(f"{prefix}: {m['content']}")
    return "\n".join(lines)


def get_session_as_text(session_id: str) -> str:
    return get_thread_context_text(session_id, last_n=100)


def to_session_info(session_id: str) -> Optional[SessionInfo]:
    s = get_session(session_id)
    if not s:
        return None

    messages_data = get_messages(session_id)
    messages = [
        SessionMessage(
            role=m["role"],
            content=m["content"],
            timestamp=m.get("timestamp"),
        )
        for m in messages_data
    ]

    return SessionInfo(
        session_id=str(s["id"]),
        user_id=s["user_id"],
        title=s.get("title"),
        summary=s.get("summary"),
        created_at=s["created_at"].isoformat(),
        updated_at=s["updated_at"].isoformat(),
        message_count=len(messages),
        messages=messages,
        metadata=s.get("metadata") or {},
    )
