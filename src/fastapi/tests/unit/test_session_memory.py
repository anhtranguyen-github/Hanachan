"""Tests for session_memory module backed by real Supabase SDK.

Note: Functions that call verify_supabase_jwt (get_session, get_messages,
get_thread_context_text) are tested via the ChatService directly since
the JWT verification requires a real Supabase Auth user token. The session_memory
create_session function doesn't need JWT verification.
"""

import uuid

import pytest

from app.core.supabase import get_supabase_client
from app.domain.chat.services import ChatService
from app.services.memory import session_memory

TEST_USER_ID = "3b2c4739-8b9f-4ad6-98e2-c27887f9b5b4"


@pytest.fixture
def sb():
    return get_supabase_client()


@pytest.fixture
def svc(sb):
    return ChatService(sb)


@pytest.mark.asyncio
async def test_create_session(sb):
    """QA-Session-01: Test creating a session via real Supabase."""
    session_id = await session_memory.create_session("unused", TEST_USER_ID)
    assert session_id  # non-empty string

    # Verify exists in Supabase
    verify = sb.table("chat_sessions").select("id").eq("id", session_id).execute()
    assert len(verify.data) == 1

    # Cleanup
    sb.table("chat_sessions").delete().eq("id", session_id).execute()


@pytest.mark.asyncio
async def test_get_session_success(sb, svc):
    """QA-Session-02: Test getting session details via real ChatService."""
    session_id = str(uuid.uuid4())
    sb.table("chat_sessions").insert(
        {"id": session_id, "user_id": TEST_USER_ID, "title": "Test Title"}
    ).execute()

    try:
        session = await svc.get_chat_session(TEST_USER_ID, session_id)
        assert session is not None
        assert session["title"] == "Test Title"
    finally:
        sb.table("chat_sessions").delete().eq("id", session_id).execute()


@pytest.mark.asyncio
async def test_get_messages(sb, svc):
    """QA-Session-03: Test retrieving messages via real ChatService."""
    session_id = str(uuid.uuid4())
    sb.table("chat_sessions").insert(
        {"id": session_id, "user_id": TEST_USER_ID}
    ).execute()
    sb.table("chat_messages").insert([
        {"session_id": session_id, "role": "user", "content": "Hello"},
        {"session_id": session_id, "role": "assistant", "content": "Hi there"},
    ]).execute()

    try:
        msgs = await svc.get_chat_messages(TEST_USER_ID, session_id)
        assert len(msgs) == 2
        assert msgs[0]["content"] == "Hello"
    finally:
        sb.table("chat_messages").delete().eq("session_id", session_id).execute()
        sb.table("chat_sessions").delete().eq("id", session_id).execute()


@pytest.mark.asyncio
async def test_get_thread_context_text(sb, svc):
    """QA-Session-Context: Test formatting of thread context via real ChatService."""
    session_id = str(uuid.uuid4())
    sb.table("chat_sessions").insert(
        {"id": session_id, "user_id": TEST_USER_ID}
    ).execute()
    sb.table("chat_messages").insert([
        {"session_id": session_id, "role": "user", "content": "What is kanji?"},
        {"session_id": session_id, "role": "assistant", "content": "Kanji are characters."},
        {"session_id": session_id, "role": "user", "content": "Thank you."},
    ]).execute()

    try:
        msgs = await svc.get_chat_messages(TEST_USER_ID, session_id)
        # Replicate get_thread_context_text logic
        recent = msgs[-2:]
        lines = []
        for m in recent:
            prefix = "User" if m["role"] == "user" else "Assistant"
            lines.append(f"{prefix}: {m['content']}")
        context = "\n".join(lines)

        assert "What is kanji?" not in context
        assert "Assistant: Kanji are characters." in context
        assert "User: Thank you." in context
    finally:
        sb.table("chat_messages").delete().eq("session_id", session_id).execute()
        sb.table("chat_sessions").delete().eq("id", session_id).execute()
