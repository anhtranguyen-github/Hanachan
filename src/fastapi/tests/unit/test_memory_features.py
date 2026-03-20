"""Tests for memory context and search endpoints against real services."""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient

from app.core.supabase import get_supabase_client
from tests.conftest import TEST_USER_ID


@pytest.mark.asyncio
@pytest.mark.xfail(reason="Omniroute does not support OpenAI embeddings API — episodic memory init fails", strict=False)
async def test_context_includes_thread_history_and_memories(
    app, authenticated_client: AsyncClient, sample_user_id: str
):
    """Context endpoint returns thread history and memory from real services."""
    sb = get_supabase_client()
    session_id = str(uuid.uuid4())
    sb.table("chat_sessions").insert(
        {"id": session_id, "user_id": sample_user_id}
    ).execute()
    sb.table("chat_messages").insert([
        {"session_id": session_id, "role": "user", "content": "Hi"},
        {"session_id": session_id, "role": "assistant", "content": "Hello!"},
    ]).execute()

    try:
        res = await authenticated_client.post(
            "/api/v1/memory/context",
            json={
                "user_id": sample_user_id,
                "query": "show my progress",
                "session_id": session_id,
                "max_episodic": 3,
            },
        )
        assert res.status_code == 200
        body = res.json()
        assert body["user_id"] == sample_user_id
        assert "thread_history" in body
        assert len(body["thread_history"]) == 2
        assert "### Current Thread" in body["system_prompt_block"]
    finally:
        sb.table("chat_messages").delete().eq("session_id", session_id).execute()
        sb.table("chat_sessions").delete().eq("id", session_id).execute()


@pytest.mark.asyncio
async def test_context_rejects_cross_user_access(
    authenticated_client: AsyncClient, sample_user_id: str
):
    other_user_id = "00000000-0000-0000-0000-000000000000"
    assert other_user_id != sample_user_id

    res = await authenticated_client.post(
        "/api/v1/memory/context",
        json={"user_id": other_user_id, "query": "hi"},
    )
    assert res.status_code == 400
    assert "Invalid user_id" in res.text


@pytest.mark.asyncio
@pytest.mark.xfail(reason="Omniroute does not support OpenAI embeddings API — episodic memory init fails", strict=False)
async def test_episodic_search_returns_results(authenticated_client: AsyncClient, sample_user_id: str):
    """Episodic search against real Qdrant — may return empty if no data for user."""
    res = await authenticated_client.post(
        "/api/v1/memory/episodic/search",
        json={"user_id": sample_user_id, "query": "memory", "k": 2},
    )

    assert res.status_code == 200
    body = res.json()
    assert body["user_id"] == sample_user_id
    assert body["query"] == "memory"
    assert isinstance(body["results"], list)


@pytest.mark.asyncio
async def test_episodic_search_rejects_cross_user_access(
    authenticated_client: AsyncClient, sample_user_id: str
):
    other_user_id = "00000000-0000-0000-0000-000000000000"
    assert other_user_id != sample_user_id

    res = await authenticated_client.post(
        "/api/v1/memory/episodic/search",
        json={"user_id": other_user_id, "query": "memory", "k": 2},
    )
    assert res.status_code == 400
    assert "Invalid user_id" in res.text


@pytest.mark.asyncio
async def test_semantic_search_returns_results(authenticated_client: AsyncClient, sample_user_id: str):
    """Semantic search against real Neo4j — may return empty if no data for user."""
    res = await authenticated_client.post(
        "/api/v1/memory/semantic/search",
        json={"user_id": sample_user_id, "query": "goal jlpt"},
    )

    assert res.status_code == 200
    body = res.json()
    assert body["user_id"] == sample_user_id
    assert isinstance(body["results"], list)


@pytest.mark.asyncio
async def test_semantic_search_rejects_cross_user_access(
    authenticated_client: AsyncClient, sample_user_id: str
):
    other_user_id = "00000000-0000-0000-0000-000000000000"
    assert other_user_id != sample_user_id

    res = await authenticated_client.post(
        "/api/v1/memory/semantic/search",
        json={"user_id": other_user_id, "query": "goal jlpt"},
    )
    assert res.status_code == 400
    assert "Invalid user_id" in res.text


@pytest.mark.asyncio
async def test_session_history_uses_supabase(app, authenticated_client: AsyncClient):
    """Session history endpoint reads from real Supabase."""
    sb = get_supabase_client()
    session_id = str(uuid.uuid4())
    sb.table("chat_sessions").insert(
        {"id": session_id, "user_id": TEST_USER_ID, "title": "History Test", "summary": "test summary"}
    ).execute()

    try:
        res = await authenticated_client.get(f"/api/v1/memory/session/{session_id}")
        assert res.status_code == 200
        body = res.json()
        assert body["id"] == session_id
        assert body["title"] == "History Test"
    finally:
        sb.table("chat_sessions").delete().eq("id", session_id).execute()

