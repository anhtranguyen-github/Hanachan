from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.agents.memory_agent import update_memory_node


@pytest.mark.asyncio
async def test_update_memory_node_persistence():
    """QA-Memory: Verify update_memory_node calls MCP tools for persistence"""
    state = {
        "user_id": "u1",
        "jwt": "token123",
        "session_id": "sess-123",
        "user_input": "Who are you?",
        "generation": "I am Hanachan.",
        "retrieved_episodic": "",
        "retrieved_semantic": "",
    }

    with (
        patch(
            "app.mcp.client.McpClient.call_tool", new_callable=AsyncMock
        ) as mock_call,
        patch("app.agents.memory_agent.nodes.implementation.make_llm") as mock_make_llm,
    ):
        # Mock LLM instance
        mock_llm_instance = MagicMock()
        mock_llm_instance.invoke.return_value = MagicMock(content="日本語の学習")
        mock_llm_instance.with_structured_output.return_value = mock_llm_instance
        mock_make_llm.return_value = mock_llm_instance

        # Mock MCP calls
        async def side_effect(tool_name, args, jwt=None):
            if tool_name == "get_chat_messages":
                return []  # Simulate new session
            return {"status": "success"}

        mock_call.side_effect = side_effect

        await update_memory_node(state)

        # Verify calls to MCP tools
        calls = [c.args for c in mock_call.await_args_list]
        kwargs = [c.kwargs for c in mock_call.await_args_list]
        tool_names = [c[0] for c in calls]

        assert "upsert_chat_session" in tool_names
        assert "add_chat_message" in tool_names
        assert "update_chat_session" in tool_names  # Verify title was updated
        assert all(k.get("jwt") == "token123" for k in kwargs)

        title_call_idx = next(i for i, c in enumerate(calls) if c[0] == "update_chat_session")
        title_call_args = calls[title_call_idx]
        assert "日本語の学習" in title_call_args[1]["title"]
