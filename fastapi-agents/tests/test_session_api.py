"""
Tests for the session API endpoints.
All session_memory calls are mocked to avoid DB dependencies.
"""

from __future__ import annotations

from datetime import UTC, datetime
from unittest.mock import patch

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
        "created_at": datetime.now(UTC).isoformat(),
        "updated_at": datetime.now(UTC).isoformat(),
        "message_count": 0,
    }


def _make_service_role_headers() -> dict:
    """Use the test service role token that conftest.py mock auth accepts."""
    return {"Authorization": "Bearer test-service-key-32-chars-at-least-wow"}


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
async def test_create_session_success(client: AsyncClient):
    """POST /session should create a session for the authenticated user."""
    user_id = "service_role"
    session_id = "sess-abc-123"
    session_data = _make_session(session_id, user_id)

    with patch(
        "app.core.domain_client.DomainClient.upsert_chat_session", return_value=session_data
    ):
        response = await client.post(
            "/api/v1/memory/session",
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
    # Simulate DomainClient raising error or returning None
    with patch("app.core.domain_client.DomainClient.get_chat_session") as mocked:
        from fastapi import HTTPException

        mocked.side_effect = HTTPException(status_code=404, detail="Not found")

        response = await client.get(
            "/api/v1/memory/session/nonexistent-session",
            headers=_make_service_role_headers(),
        )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_list_sessions_requires_auth(client: AsyncClient):
    """GET /sessions/{user_id} should return 401 without auth."""
    response = await client.get("/api/v1/memory/sessions")
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
            "created_at": datetime.now(UTC).isoformat(),
            "updated_at": datetime.now(UTC).isoformat(),
        }
    ]

    with patch(
        "app.core.domain_client.DomainClient.list_chat_sessions", return_value=mock_sessions
    ):
        response = await client.get(
            "/api/v1/memory/sessions",
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
    with patch("app.core.domain_client.DomainClient.delete_chat_session") as mocked:
        from fastapi import HTTPException

        mocked.side_effect = HTTPException(status_code=404, detail="Not found")

        response = await client.delete(
            "/api/v1/memory/session/nonexistent-session",
            headers=_make_service_role_headers(),
        )
    assert response.status_code == 404
