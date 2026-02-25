"""
Session / Working Memory — backed by PostgreSQL (Supabase Fallback).
"""
from __future__ import annotations

import uuid
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from ...core.config import settings
from ...schemas.session import SessionInfo, SessionMessage, SessionSummary
from ...core.database import execute_query, execute_single

# ---------------------------------------------------------------------------
# LLM helpers (lazy)
# ---------------------------------------------------------------------------

_llm: Optional[ChatOpenAI] = None

def _get_llm() -> ChatOpenAI:
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(
            model=settings.llm_model,
            temperature=0,
            openai_api_key=settings.openai_api_key,
        )
    return _llm


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
        chain = _TITLE_PROMPT | _get_llm()
        return chain.invoke({"snippet": snippet}).content.strip()
    except Exception:
        return user_msg[:60]


def _update_summary(existing: str, user_msg: str, assistant_msg: str) -> str:
    try:
        chain = _SUMMARY_PROMPT | _get_llm()
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
        "INSERT INTO public.sessions (session_id, user_id, created_at, updated_at, metadata) VALUES (%s, %s, %s, %s, %s)",
        (session_id, user_id, now, now, json.dumps(metadata or {})),
        fetch=False
    )
    
    return session_id


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    return execute_single("SELECT * FROM public.sessions WHERE session_id = %s", (session_id,))


def list_sessions(user_id: str) -> List[SessionSummary]:
    sessions = execute_query(
        "SELECT s.*, (SELECT count(*) FROM public.messages m WHERE m.session_id = s.session_id) as message_count "
        "FROM public.sessions s WHERE s.user_id = %s ORDER BY s.updated_at DESC", 
        (user_id,)
    )
    
    return [
        SessionSummary(
            session_id=str(s["session_id"]),
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
    now = datetime.now(timezone.utc)
    if title and metadata:
        execute_query(
            "UPDATE public.sessions SET title = %s, metadata = metadata || %s, updated_at = %s WHERE session_id = %s",
            (title, json.dumps(metadata), now, session_id), fetch=False
        )
    elif title:
        execute_query(
            "UPDATE public.sessions SET title = %s, updated_at = %s WHERE session_id = %s",
            (title, now, session_id), fetch=False
        )
    elif metadata:
        execute_query(
            "UPDATE public.sessions SET metadata = metadata || %s, updated_at = %s WHERE session_id = %s",
            (json.dumps(metadata), now, session_id), fetch=False
        )
    else:
        execute_query("UPDATE public.sessions SET updated_at = %s WHERE session_id = %s", (now, session_id), fetch=False)
    return True


def end_session(session_id: str) -> Optional[Dict[str, Any]]:
    session = to_session_info(session_id)
    if not session:
        return None
    execute_query("DELETE FROM public.sessions WHERE session_id = %s", (session_id,), fetch=False)
    return session.model_dump()


def delete_all_sessions(user_id: str) -> int:
    # Need to check how many were deleted
    execute_query("DELETE FROM public.sessions WHERE user_id = %s", (user_id,), fetch=False)
    return 0 # Simplified


# ---------------------------------------------------------------------------
# Message management + auto title/summary
# ---------------------------------------------------------------------------

def add_message(session_id: str, role: str, content: str) -> bool:
    now = datetime.now(timezone.utc)
    execute_query(
        "INSERT INTO public.messages (session_id, role, content, timestamp) VALUES (%s, %s, %s, %s)",
        (session_id, role, content, now), fetch=False
    )
    execute_query("UPDATE public.sessions SET updated_at = %s WHERE session_id = %s", (now, session_id), fetch=False)

    if role == "assistant":
        session = get_session(session_id)
        if session:
            messages = get_messages(session_id)
            user_msgs = [m for m in messages if m["role"] == "user"]
            last_user = user_msgs[-1]["content"] if user_msgs else ""

            if not session.get("title") and last_user:
                title = _generate_title(last_user, content)
                update_session_meta(session_id, title=title)

            updated_summary = _update_summary(
                session.get("summary") or "",
                last_user,
                content,
            )
            execute_query("UPDATE public.sessions SET summary = %s WHERE session_id = %s", (updated_summary, session_id), fetch=False)

    return True


def get_messages(session_id: str) -> List[Dict[str, str]]:
    messages = execute_query(
        "SELECT role, content, timestamp FROM public.messages WHERE session_id = %s ORDER BY timestamp", 
        (session_id,)
    )
    for m in messages:
        if isinstance(m["timestamp"], datetime):
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
    if s is None:
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
        session_id=str(s["session_id"]),
        user_id=s["user_id"],
        title=s.get("title"),
        summary=s.get("summary"),
        created_at=s["created_at"].isoformat(),
        updated_at=s["updated_at"].isoformat(),
        message_count=len(messages),
        messages=messages,
        metadata=s.get("metadata") or {},
    )
