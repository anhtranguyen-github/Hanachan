"""
Tests for reading agent endpoints.
These endpoints coordinate between Core Service and LLM Agents.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_reading_session_coordination(authenticated_client: AsyncClient):
    """Creating a reading session should coordinate between Core and Agents."""
    mock_config = {"exercises_per_session": 3}
    mock_exercises = [{"id": "ex1", "text": "Read this."}]
    mock_persist_result = {"status": "success", "session_id": "rs-123"}
    
    with (
        patch("app.api.v1.endpoints.reading.CoreClient._get", new_callable=AsyncMock, return_value=mock_config),
        patch("app.api.v1.endpoints.reading.get_user_learning_context", new_callable=AsyncMock, return_value={}),
        patch("app.api.v1.endpoints.reading.generate_reading_session", new_callable=AsyncMock, return_value=mock_exercises),
        patch("app.api.v1.endpoints.reading.CoreClient._post", new_callable=AsyncMock, return_value=mock_persist_result),
    ):
        response = await authenticated_client.post(
            "/api/v1/reading/sessions",
            json={"topics": ["daily_life"]}
        )
        
    assert response.status_code == 200
    assert response.json()["session_id"] == "rs-123"


@pytest.mark.asyncio
async def test_create_reading_session_fallback_config(authenticated_client: AsyncClient):
    """If Core config fails, it should fallback to defaults."""
    mock_exercises = [{"id": "ex1", "text": "Read this."}]
    mock_persist_result = {"status": "success"}
    
    with (
        patch("app.api.v1.endpoints.reading.CoreClient._get", new_callable=AsyncMock, side_effect=Exception("Core down")),
        patch("app.api.v1.endpoints.reading.get_user_learning_context", new_callable=AsyncMock, return_value={}),
        patch("app.api.v1.endpoints.reading.generate_reading_session", new_callable=AsyncMock, return_value=mock_exercises),
        patch("app.api.v1.endpoints.reading.CoreClient._post", new_callable=AsyncMock, return_value=mock_persist_result),
    ):
        response = await authenticated_client.post(
            "/api/v1/reading/sessions",
            json={}
        )
        
    assert response.status_code == 200
    assert response.json()["status"] == "success"


@pytest.mark.asyncio
async def test_create_reading_session_persistence_failure(authenticated_client: AsyncClient):
    """If persistence to Core fails, it should return a 500."""
    mock_config = {"exercises_per_session": 3}
    mock_exercises = [{"id": "ex1"}]
    
    with (
        patch("app.api.v1.endpoints.reading.CoreClient._get", new_callable=AsyncMock, return_value=mock_config),
        patch("app.api.v1.endpoints.reading.get_user_learning_context", new_callable=AsyncMock, return_value={}),
        patch("app.api.v1.endpoints.reading.generate_reading_session", new_callable=AsyncMock, return_value=mock_exercises),
        patch("app.api.v1.endpoints.reading.CoreClient._post", new_callable=AsyncMock, side_effect=Exception("Core timeout")),
    ):
        response = await authenticated_client.post(
            "/api/v1/reading/sessions",
            json={}
        )
        
    assert response.status_code == 500
    assert "Failed to save generated content" in response.json()["detail"]
