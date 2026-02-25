"""
Session / Working Memory — in-memory conversation buffer per thread.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from threading import Lock
from typing import Any, Dict, List, Optional

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from ...core.config import settings
from ...schemas.session import SessionInfo, SessionMessage, SessionSummary

# ---------------------------------------------------------------------------
# Store
# ---------------------------------------------------------------------------

_sessions: Dict[str, Dict[str, Any]] = {}
_lock = Lock()
MAX_SESSION_MESSAGES = 50

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
    now = datetime.now(timezone.utc).isoformat()
    with _lock:
        _sessions[session_id] = {
            "session_id": session_id,
            "user_id": user_id,
            "title": None,
            "summary": None,
            "created_at": now,
            "updated_at": now,
            "messages": [],
            "metadata": metadata or {},
        }
    return session_id


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    return _sessions.get(session_id)


def list_sessions(user_id: str) -> List[SessionSummary]:
    with _lock:
        return [
            SessionSummary(
                session_id=s["session_id"],
                user_id=s["user_id"],
                title=s.get("title"),
                summary=s.get("summary"),
                created_at=s["created_at"],
                updated_at=s["updated_at"],
                message_count=len(s["messages"]),
                metadata=s["metadata"],
            )
            for s in _sessions.values()
            if s["user_id"] == user_id
        ]


def update_session_meta(
    session_id: str,
    title: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> bool:
    with _lock:
        s = _sessions.get(session_id)
        if s is None:
            return False
        if title is not None:
            s["title"] = title
        if metadata is not None:
            s["metadata"].update(metadata)
        s["updated_at"] = datetime.now(timezone.utc).isoformat()
        return True


def end_session(session_id: str) -> Optional[Dict[str, Any]]:
    """Remove and return session data for consolidation."""
    with _lock:
        return _sessions.pop(session_id, None)


def delete_all_sessions(user_id: str) -> int:
    with _lock:
        to_delete = [sid for sid, s in _sessions.items() if s["user_id"] == user_id]
        for sid in to_delete:
            del _sessions[sid]
        return len(to_delete)


# ---------------------------------------------------------------------------
# Message management + auto title/summary
# ---------------------------------------------------------------------------

def add_message(session_id: str, role: str, content: str) -> bool:
    """
    Append a message. When role=='assistant', also:
      • auto-generate a title if one doesn't exist yet
      • update the rolling summary
    """
    with _lock:
        s = _sessions.get(session_id)
        if s is None:
            return False
        s["messages"].append(
            {
                "role": role,
                "content": content,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
        s["updated_at"] = datetime.now(timezone.utc).isoformat()

        # Trim
        if len(s["messages"]) > MAX_SESSION_MESSAGES:
            system_msgs = [m for m in s["messages"] if m["role"] == "system"]
            recent = [m for m in s["messages"] if m["role"] != "system"][-MAX_SESSION_MESSAGES:]
            s["messages"] = system_msgs + recent

    # Title + summary updates
    if role == "assistant":
        s = _sessions.get(session_id)
        if s:
            user_msgs = [m for m in s["messages"] if m["role"] == "user"]
            last_user = user_msgs[-1]["content"] if user_msgs else ""

            if not s.get("title") and last_user:
                title = _generate_title(last_user, content)
                with _lock:
                    if session_id in _sessions:
                        _sessions[session_id]["title"] = title

            updated_summary = _update_summary(
                s.get("summary") or "",
                last_user,
                content,
            )
            with _lock:
                if session_id in _sessions:
                    _sessions[session_id]["summary"] = updated_summary

    return True


def get_messages(session_id: str) -> List[Dict[str, str]]:
    s = _sessions.get(session_id)
    return s["messages"] if s else []


def get_thread_context_text(session_id: str, last_n: int = 10) -> str:
    """
    Return the last N message pairs as a formatted string for LLM context injection.
    """
    messages = get_messages(session_id)
    recent = messages[-last_n:]
    lines = []
    for m in recent:
        prefix = "User" if m["role"] == "user" else "Assistant"
        lines.append(f"{prefix}: {m['content']}")
    return "\n".join(lines)


def get_session_as_text(session_id: str) -> str:
    """Full conversation as plain text (for consolidation on session end)."""
    return get_thread_context_text(session_id, last_n=MAX_SESSION_MESSAGES)


def to_session_info(session_id: str) -> Optional[SessionInfo]:
    s = _sessions.get(session_id)
    if s is None:
        return None
    return SessionInfo(
        session_id=s["session_id"],
        user_id=s["user_id"],
        title=s.get("title"),
        summary=s.get("summary"),
        created_at=s["created_at"],
        updated_at=s["updated_at"],
        message_count=len(s["messages"]),
        messages=[
            SessionMessage(
                role=m["role"],
                content=m["content"],
                timestamp=m.get("timestamp"),
            )
            for m in s["messages"]
        ],
        metadata=s["metadata"],
    )
