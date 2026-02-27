"""
Tests for the session API endpoints.
All session_memory calls are mocked to avoid DB dependencies.
"""
from __future__ import annotations

from unittest.mock import patch, MagicMock
from datetime import datetime, timezone

import pytest
from httpx import AsyncClient


# ── Helpers ──────────────────────────────────────────────────────────────────

def _make_session(session_id: str, user_id: str) -> dict:
    return {
        "session_id": session_id,
        "user_id": user_id,
        "title": "Test Session",
        "summary": None,
        "messages": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "message_count": 0,
    }


def _make_service_role_headers() -> dict:
    """Use the Supabase key as service role auth."""
    from app.core.config import settings
    return {"Authorization": f"Bearer {settings.supabase_key}"}


# ── Tests ─────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_session_requires_auth(client: AsyncClient):
    """POST /session should return 401 without auth."""
    response = await client.post(
        "/api/v1/session",
        json={"user_id": "user-123"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_create_session_success(client: AsyncClient):
    """POST /session should create a session for the authenticated user."""
    user_id = "service_role"  # service_role token has sub=service_role
    session_id = "sess-abc-123"
    session_data = _make_session(session_id, user_id)

    with (
        patch("app.services.memory.session_memory.create_session", return_value=session_id),
        patch("app.services.memory.session_memory.get_session", return_value=session_data),
    ):
        response = await client.post(
            "/api/v1/session",
            json={"user_id": user_id},
            headers=_make_service_role_headers(),
        )

    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == session_id
    assert data["user_id"] == user_id


@pytest.mark.asyncio
async def test_get_session_not_found(client: AsyncClient):
    """GET /session/{id} should return 404 for non-existent sessions."""
    with patch("app.services.memory.session_memory.get_session", return_value=None):
        response = await client.get(
            "/api/v1/session/nonexistent-session",
            headers=_make_service_role_headers(),
        )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_sessions_requires_auth(client: AsyncClient):
    """GET /sessions/{user_id} should return 401 without auth."""
    response = await client.get("/api/v1/sessions/user-123")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_list_sessions_success(client: AsyncClient):
    """GET /sessions/{user_id} should return a list of sessions."""
    user_id = "service_role"
    mock_sessions = [
        {
            "session_id": "sess-1",
            "user_id": user_id,
            "title": "Session 1",
            "summary": None,
            "message_count": 5,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    ]

    with patch("app.services.memory.session_memory.list_sessions", return_value=mock_sessions):
        response = await client.get(
            f"/api/v1/sessions/{user_id}",
            headers=_make_service_role_headers(),
        )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["session_id"] == "sess-1"


@pytest.mark.asyncio
async def test_end_session_not_found(client: AsyncClient):
    """DELETE /session/{id} should return 404 for non-existent sessions."""
    with (
        patch("app.services.memory.session_memory.get_session", return_value=None),
    ):
        response = await client.delete(
            "/api/v1/session/nonexistent-session",
            headers=_make_service_role_headers(),
        )
    assert response.status_code == 404
