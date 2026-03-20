from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_chat_rejects_cross_user_access(authenticated_client: AsyncClient, sample_user_id: str):
    other_user_id = "00000000-0000-0000-0000-000000000000"
    assert other_user_id != sample_user_id

    res = await authenticated_client.post(
        "/api/v1/chat",
        json={"user_id": other_user_id, "message": "hello", "session_id": "s1"},
    )

    assert res.status_code == 400
    assert "Invalid user_id" in res.text


@pytest.mark.asyncio
async def test_chat_stream_rejects_cross_user_access(authenticated_client: AsyncClient, sample_user_id: str):
    other_user_id = "00000000-0000-0000-0000-000000000000"
    assert other_user_id != sample_user_id

    res = await authenticated_client.post(
        "/api/v1/chat/stream",
        json={"user_id": other_user_id, "message": "hello", "session_id": "s1"},
    )

    assert res.status_code == 400
    assert "Invalid user_id" in res.text

