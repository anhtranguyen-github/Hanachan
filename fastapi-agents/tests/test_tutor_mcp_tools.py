from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_tutor_agent_calls_tools_and_returns_results(
    authenticated_client: AsyncClient,
):
    async def tool_side_effect(*, tool_name: str, arguments: dict, jwt: str):
        if tool_name == "get_my_profile":
            return {"id": "u", "display_name": "Test"}
        if tool_name == "get_learning_progress":
            return [{"ku_id": "k1", "strength": 0.5}]
        return None

    with patch(
        "app.agents.tutor_agent.McpClient.call_tool",
        new_callable=AsyncMock,
        side_effect=tool_side_effect,
    ) as mock_call:
        incoming_jwt = authenticated_client.headers["Authorization"].split(" ", 1)[1]
        res = await authenticated_client.post(
            "/api/v1/agent/chat",
            json={"message": "Show my profile and progress"},
        )

    assert res.status_code == 200
    body = res.json()
    assert "reply" in body
    assert "tools" in body
    assert "profile" in body["tools"]
    assert "learning_progress" in body["tools"]
    assert mock_call.await_count == 2

    # Verify JWT forwarding: agent must pass the *same* JWT from the request to MCP calls
    for call in mock_call.await_args_list:
        assert call.kwargs["jwt"] == incoming_jwt

