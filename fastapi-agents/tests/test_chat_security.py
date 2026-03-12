from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_chat_rejects_cross_user_access(authenticated_client: AsyncClient, sample_user_id: str):
    other_user_id = "00000000-0000-0000-0000-000000000000"
    assert other_user_id != sample_user_id

    with patch("app.api.v1.endpoints.chat.run_chat", new_callable=AsyncMock) as mock_run:
        res = await authenticated_client.post(
            "/api/v1/chat",
            json={"user_id": other_user_id, "message": "hello", "session_id": "s1"},
        )

    assert res.status_code == 400
    assert "Invalid user_id" in res.text
    mock_run.assert_not_awaited()


@pytest.mark.asyncio
async def test_chat_stream_rejects_cross_user_access(authenticated_client: AsyncClient, sample_user_id: str):
    other_user_id = "00000000-0000-0000-0000-000000000000"
    assert other_user_id != sample_user_id

    # Should reject before any graph streaming is attempted
    with patch(
        "app.api.v1.endpoints.chat.memory_graph.astream_events", new_callable=AsyncMock
    ) as mock_stream:
        res = await authenticated_client.post(
            "/api/v1/chat/stream",
            json={"user_id": other_user_id, "message": "hello", "session_id": "s1"},
        )

    assert res.status_code == 400
    assert "Invalid user_id" in res.text
    mock_stream.assert_not_awaited()

