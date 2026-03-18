"""
Tests for session management endpoints.
These endpoints proxy to the Core Service via the CoreClient.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_session_proxies_to_core(authenticated_client: AsyncClient):
    """Creating a session should proxy to the Core Service."""
    mock_session = {"id": "sess-123", "title": "New Session"}
    
    with patch(
        "app.api.v1.endpoints.session.CoreClient.upsert_chat_session",
        new_callable=AsyncMock,
        return_value=mock_session,
    ):
        response = await authenticated_client.post("/api/v1/memory/session")
        
    assert response.status_code == 200
    assert response.json()["id"] == "sess-123"


@pytest.mark.asyncio
async def test_list_sessions_proxies_to_core(authenticated_client: AsyncClient):
    """Listing sessions should proxy to the Core Service."""
    mock_sessions = [{"id": "sess-1", "title": "Session 1"}]
    
    with patch(
        "app.api.v1.endpoints.session.CoreClient.list_chat_sessions",
        new_callable=AsyncMock,
        return_value=mock_sessions,
    ):
        response = await authenticated_client.get("/api/v1/memory/sessions")
        
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == "sess-1"


@pytest.mark.asyncio
async def test_get_session_proxies_to_core(authenticated_client: AsyncClient):
    """Getting session details should proxy to the Core Service."""
    mock_session = {"id": "sess-123", "title": "Session 123", "messages": []}
    
    with patch(
        "app.api.v1.endpoints.session.CoreClient.get_chat_session",
        new_callable=AsyncMock,
        return_value=mock_session,
    ):
        response = await authenticated_client.get("/api/v1/memory/session/sess-123")
        
    assert response.status_code == 200
    assert response.json()["id"] == "sess-123"


@pytest.mark.asyncio
async def test_update_session_proxies_to_core(authenticated_client: AsyncClient):
    """Updating a session should proxy to the Core Service."""
    mock_response = {"status": "updated"}
    
    with patch(
        "app.api.v1.endpoints.session.CoreClient.update_chat_session",
        new_callable=AsyncMock,
        return_value=mock_response,
    ):
        response = await authenticated_client.patch(
            "/api/v1/memory/session/sess-123",
            json={"title": "Updated Title", "summary": "Updated Summary"}
        )
        
    assert response.status_code == 200
    assert response.json()["status"] == "updated"


@pytest.mark.asyncio
async def test_delete_session_proxies_to_core(authenticated_client: AsyncClient):
    """Deleting a session should proxy to the Core Service."""
    mock_response = {"status": "deleted"}
    
    with patch(
        "app.api.v1.endpoints.session.CoreClient.delete_chat_session",
        new_callable=AsyncMock,
        return_value=mock_response,
    ):
        response = await authenticated_client.delete("/api/v1/memory/session/sess-123")
        
    assert response.status_code == 200
    assert response.json()["status"] == "deleted"
