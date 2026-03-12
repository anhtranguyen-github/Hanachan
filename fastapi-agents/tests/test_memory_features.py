from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.schemas.memory import EpisodicMemory


@pytest.mark.asyncio
async def test_context_includes_thread_history_and_memories(
    authenticated_client: AsyncClient, sample_user_id: str
):
    ep_hits = [
        EpisodicMemory(
            id="m1",
            text="User likes kanji practice.",
            score=0.9,
            created_at="2026-01-01",
        )
    ]
    sem_hits = [
        {
            "node": {"id": "User", "type": "User"},
            "relationship": "LIKES",
            "related": {"id": "Kanji", "type": "Topic"},
        }
    ]
    thread_msgs = [
        {"role": "user", "content": "Hi", "timestamp": "2026-01-01T00:00:00Z"},
        {"role": "assistant", "content": "Hello!", "timestamp": "2026-01-01T00:00:01Z"},
    ]

    with (
        patch("app.api.v1.endpoints.memory.ep_mem.search_episodic_memory", return_value=ep_hits),
        patch("app.api.v1.endpoints.memory.sem_mem.search_semantic_memory", return_value=sem_hits),
        patch("app.api.v1.endpoints.memory.build_user_profile", return_value={"user_id": sample_user_id}),
        patch(
            "app.api.v1.endpoints.memory.profile_to_system_prompt",
            return_value="(profile snippet)",
        ),
        patch(
            "app.api.v1.endpoints.memory.CoreClient.get_chat_messages",
            new_callable=AsyncMock,
            return_value=thread_msgs,
        ),
    ):
        res = await authenticated_client.post(
            "/api/v1/memory/context",
            json={
                "user_id": sample_user_id,
                "query": "show my progress",
                "session_id": "sess-1",
                "max_episodic": 3,
            },
        )

    assert res.status_code == 200
    body = res.json()
    assert body["user_id"] == sample_user_id
    assert body["episodic_memories"]
    assert body["semantic_facts"]
    assert body["thread_history"]
    assert "### Current Thread" in body["system_prompt_block"]


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
async def test_episodic_search_returns_hits(authenticated_client: AsyncClient, sample_user_id: str):
    hits = [
        EpisodicMemory(id="m1", text="Past memory", score=0.42, created_at="2026-01-01"),
        EpisodicMemory(id="m2", text="Another memory", score=0.41, created_at="2026-01-02"),
    ]

    with patch("app.api.v1.endpoints.memory.ep_mem.search_episodic_memory", return_value=hits):
        res = await authenticated_client.post(
            "/api/v1/memory/episodic/search",
            json={"user_id": sample_user_id, "query": "memory", "k": 2},
        )

    assert res.status_code == 200
    body = res.json()
    assert body["user_id"] == sample_user_id
    assert body["query"] == "memory"
    assert len(body["results"]) == 2
    assert body["results"][0]["id"] == "m1"


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
async def test_semantic_search_returns_hits(authenticated_client: AsyncClient, sample_user_id: str):
    hits = [
        {
            "node": {"id": "u", "type": "User"},
            "relationship": "HAS_GOAL",
            "related": {"id": "JLPT N3", "type": "Goal"},
        }
    ]

    with patch("app.api.v1.endpoints.memory.sem_mem.search_semantic_memory", return_value=hits):
        res = await authenticated_client.post(
            "/api/v1/memory/semantic/search",
            json={"user_id": sample_user_id, "query": "goal jlpt"},
        )

    assert res.status_code == 200
    body = res.json()
    assert body["user_id"] == sample_user_id
    assert body["results"] == hits


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
async def test_session_history_proxies_core(authenticated_client: AsyncClient):
    core_payload = {"id": "sess-123", "title": "t", "summary": "s", "messages": []}

    with patch(
        "app.api.v1.endpoints.session.CoreClient.get_chat_session",
        new_callable=AsyncMock,
        return_value=core_payload,
    ):
        res = await authenticated_client.get("/api/v1/memory/session/sess-123")

    assert res.status_code == 200
    assert res.json()["id"] == "sess-123"

