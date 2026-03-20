"""
Tests for the session API endpoints.
All tests use real Supabase for CRUD — no mocks.
"""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient

from tests.conftest import TEST_USER_ID, make_test_token


# ── Tests ─────────────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_create_session_requires_auth(client: AsyncClient):
    """POST /session should return 401 without auth."""
    response = await client.post(
        "/api/v1/memory/session",
        json={"user_id": "user-123"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_session_success(app, client: AsyncClient, supabase_client):
    """POST /session should create a session in real Supabase."""
    headers = {"Authorization": f"Bearer {make_test_token(user_id=TEST_USER_ID)}"}
    response = await client.post(
        "/api/v1/memory/session",
        json={"user_id": TEST_USER_ID},
        headers=headers,
    )

    assert response.status_code == 200
    data = response.json()
    session_id = data.get("id") or data.get("session_id")
    assert session_id

    # Verify in real Supabase
    verify = supabase_client.table("chat_sessions").select("user_id").eq("id", session_id).execute()
    assert len(verify.data) == 1
    assert verify.data[0]["user_id"] == TEST_USER_ID

    # Cleanup
    supabase_client.table("chat_sessions").delete().eq("id", session_id).execute()


@pytest.mark.asyncio
async def test_get_session_not_found(app, client: AsyncClient):
    """GET /session/{id} should return 200 + null for non-existent sessions."""
    headers = {"Authorization": f"Bearer {make_test_token(user_id=TEST_USER_ID)}"}
    response = await client.get(
        "/api/v1/memory/session/00000000-0000-0000-0000-000000000000",
        headers=headers,
    )
    assert response.status_code == 200
    assert response.json() is None


@pytest.mark.asyncio
async def test_list_sessions_requires_auth(client: AsyncClient):
    """GET /sessions should return 401 without auth."""
    response = await client.get("/api/v1/memory/sessions")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_sessions_success(app, client: AsyncClient, supabase_client):
    """GET /sessions should return a list of real sessions."""
    headers = {"Authorization": f"Bearer {make_test_token(user_id=TEST_USER_ID)}"}

    # Create a test session
    session_id = str(uuid.uuid4())
    supabase_client.table("chat_sessions").insert(
        {"id": session_id, "user_id": TEST_USER_ID, "title": "List Test Session"}
    ).execute()

    try:
        response = await client.get(
            "/api/v1/memory/sessions",
            headers=headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert any(s.get("id") == session_id for s in data)
    finally:
        supabase_client.table("chat_sessions").delete().eq("id", session_id).execute()


@pytest.mark.asyncio
async def test_end_session_deletes(app, client: AsyncClient, supabase_client):
    """DELETE /session/{id} should remove the session from real Supabase."""
    headers = {"Authorization": f"Bearer {make_test_token(user_id=TEST_USER_ID)}"}
    session_id = str(uuid.uuid4())
    supabase_client.table("chat_sessions").insert(
        {"id": session_id, "user_id": TEST_USER_ID, "title": "To Delete"}
    ).execute()

    response = await client.delete(
        f"/api/v1/memory/session/{session_id}",
        headers=headers,
    )
    assert response.status_code == 200

    # Verify deleted
    verify = supabase_client.table("chat_sessions").select("id").eq("id", session_id).execute()
    assert len(verify.data) == 0
