"""
Tests for session management endpoints.
These endpoints use ChatService backed by real Supabase SDK.
"""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_session_proxies_to_supabase(
    app, authenticated_client: AsyncClient, sample_user_id: str, supabase_client
):
    """Creating a session should persist to real Supabase."""
    response = await authenticated_client.post("/api/v1/memory/session")

    assert response.status_code == 200
    data = response.json()
    assert "id" in data or "session_id" in data
    session_id = data.get("id") or data.get("session_id")

    # Verify it exists in real Supabase
    verify = supabase_client.table("chat_sessions").select("id").eq("id", session_id).execute()
    assert len(verify.data) == 1

    # Cleanup
    supabase_client.table("chat_sessions").delete().eq("id", session_id).execute()


@pytest.mark.asyncio
async def test_list_sessions_proxies_to_supabase(
    app, authenticated_client: AsyncClient, sample_user_id: str, supabase_client
):
    """Listing sessions should return real data from Supabase."""
    # Create a session in Supabase directly
    session_id = str(uuid.uuid4())
    supabase_client.table("chat_sessions").insert(
        {"id": session_id, "user_id": sample_user_id, "title": "Test List Session"}
    ).execute()

    try:
        response = await authenticated_client.get("/api/v1/memory/sessions")
        assert response.status_code == 200
        sessions = response.json()
        assert isinstance(sessions, list)
        assert any(s.get("id") == session_id for s in sessions)
    finally:
        supabase_client.table("chat_sessions").delete().eq("id", session_id).execute()


@pytest.mark.asyncio
async def test_get_session_proxies_to_supabase(
    app, authenticated_client: AsyncClient, sample_user_id: str, supabase_client
):
    """Getting session details should return real data from Supabase."""
    session_id = str(uuid.uuid4())
    supabase_client.table("chat_sessions").insert(
        {"id": session_id, "user_id": sample_user_id, "title": "Test Get Session"}
    ).execute()

    try:
        response = await authenticated_client.get(f"/api/v1/memory/session/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == session_id
    finally:
        supabase_client.table("chat_sessions").delete().eq("id", session_id).execute()


@pytest.mark.asyncio
async def test_update_session_proxies_to_supabase(
    app, authenticated_client: AsyncClient, sample_user_id: str, supabase_client
):
    """Updating a session should persist to real Supabase."""
    session_id = str(uuid.uuid4())
    supabase_client.table("chat_sessions").insert(
        {"id": session_id, "user_id": sample_user_id, "title": "Original Title"}
    ).execute()

    try:
        response = await authenticated_client.patch(
            f"/api/v1/memory/session/{session_id}",
            json={"title": "Updated Title", "summary": "Updated Summary"},
        )
        assert response.status_code == 200

        # Verify update in real Supabase
        verify = supabase_client.table("chat_sessions").select("title, summary").eq("id", session_id).single().execute()
        assert verify.data["title"] == "Updated Title"
        assert verify.data["summary"] == "Updated Summary"
    finally:
        supabase_client.table("chat_sessions").delete().eq("id", session_id).execute()


@pytest.mark.asyncio
async def test_delete_session_proxies_to_supabase(
    app, authenticated_client: AsyncClient, sample_user_id: str, supabase_client
):
    """Deleting a session should remove it from real Supabase."""
    session_id = str(uuid.uuid4())
    supabase_client.table("chat_sessions").insert(
        {"id": session_id, "user_id": sample_user_id, "title": "To Delete"}
    ).execute()

    response = await authenticated_client.delete(f"/api/v1/memory/session/{session_id}")
    assert response.status_code == 200

    # Verify deleted
    verify = supabase_client.table("chat_sessions").select("id").eq("id", session_id).execute()
    assert len(verify.data) == 0
