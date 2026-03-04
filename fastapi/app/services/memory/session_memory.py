"""
Session / Working Memory — backed by PostgreSQL (Supabase).
"""

from __future__ import annotations

import logging
import uuid
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from langchain_core.prompts import ChatPromptTemplate

from ...core.llm import make_llm
from ...schemas.session import SessionInfo, SessionMessage, SessionSummary
from ...core.supabase import supabase

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

_TITLE_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Generate a concise, descriptive title (5 words max) for the following "
            "conversation snippet. Return ONLY the title, no punctuation or quotes.",
        ),
        ("human", "{snippet}"),
    ]
)

_SUMMARY_PROMPT = ChatPromptTemplate.from_messages(
    [
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
    ]
)


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
    
    data = {
        "id": session_id,
        "user_id": user_id,
        "metadata": metadata or {}
    }
    
    result = supabase.table("chat_sessions").insert(data).execute()
    if not result.data:
        logger.error(f"Failed to create session in Supabase: {result}")
        raise RuntimeError("Failed to create chat session")

    return session_id


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    result = supabase.table("chat_sessions").select("*").eq("id", session_id).execute()
    return result.data[0] if result.data else None


def list_sessions(user_id: str) -> List[SessionSummary]:
    # We need to get message counts too. 
    # Since we can't easily do subqueries in Supabase JS/Python client without RPC, 
    # we'll fetch sessions first.
    result = supabase.table("chat_sessions") \
        .select("*, chat_messages(count)") \
        .eq("user_id", user_id) \
        .order("updated_at", desc=True) \
        .execute()

    return [
        SessionSummary(
            session_id=str(s["id"]),
            user_id=s["user_id"],
            title=s.get("title"),
            summary=s.get("summary"),
            created_at=s["created_at"],
            updated_at=s["updated_at"],
            message_count=s.get("chat_messages", [{}])[0].get("count", 0),
            metadata=s.get("metadata") or {},
        )
        for s in result.data
    ]


def update_session_meta(
    session_id: str,
    title: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> bool:
    updates: Dict[str, Any] = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if title:
        updates["title"] = title
    if metadata:
        updates["metadata"] = metadata

    result = supabase.table("chat_sessions").update(updates).eq("id", session_id).execute()
    return len(result.data) > 0


def end_session(session_id: str) -> Optional[Dict[str, Any]]:
    session = to_session_info(session_id)
    if not session:
        return None
    
    # In V2, 'end_session' might just mean setting an 'ended_at' or just deleting
    # The original code deleted it.
    supabase.table("chat_sessions").delete().eq("id", session_id).execute()
    return session.model_dump()


def delete_all_sessions(user_id: str) -> int:
    result = supabase.table("chat_sessions").delete().eq("user_id", user_id).execute()
    return len(result.data) if result.data else 0


# ---------------------------------------------------------------------------
# Message management + async title/summary (fire-and-forget)
# ---------------------------------------------------------------------------


def add_message(session_id: str, role: str, content: str) -> bool:
    # Ensure the session exists first
    session = get_session(session_id)
    if not session:
        logger.warning(f"Session {session_id} not found, skipping message persistence.")
        return True

    data = {
        "session_id": session_id,
        "role": role,
        "content": content
    }
    
    supabase.table("chat_messages").insert(data).execute()
    
    # Update session updated_at
    supabase.table("chat_sessions") \
        .update({"updated_at": datetime.now(timezone.utc).isoformat()}) \
        .eq("id", session_id) \
        .execute()

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
    """Background task: generate title + rolling summary."""
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
        if updated_summary:
            supabase.table("chat_sessions") \
                .update({"summary": updated_summary}) \
                .eq("id", session_id) \
                .execute()
    except Exception as exc:
        logger.error(
            "session_meta_update_failed",
            extra={"session_id": session_id, "error": str(exc)},
        )


def get_messages(session_id: str) -> List[Dict[str, str]]:
    result = supabase.table("chat_messages") \
        .select("role, content, created_at") \
        .eq("session_id", session_id) \
        .order("created_at") \
        .execute()
        
    messages = result.data or []
    for m in messages:
        if "created_at" in m:
            m["timestamp"] = m.pop("created_at")
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
        created_at=s["created_at"],
        updated_at=s["updated_at"],
        message_count=len(messages),
        messages=messages,
        metadata=s.get("metadata") or {},
    )

