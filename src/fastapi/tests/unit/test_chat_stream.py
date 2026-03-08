import json
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from app.api.v1.endpoints.chat import _persist_stream_traces


@pytest.mark.asyncio
async def test_chat_stream(authenticated_client: AsyncClient, sample_user_id: str):
    """QA-Streaming: Test the SSE /chat/stream endpoint"""

    # Yield dummy events out of the tutor agent
    async def mock_astream_events(*args, **kwargs):
        # 1. Router thought
        yield {"event": "on_chain_start", "name": "router", "data": {}}
        yield {
            "event": "on_chain_end",
            "name": "router",
            "data": {"output": {"thought": "Router → memory: I will search memory"}},
        }

        # 2. Tool Trace
        yield {
            "event": "on_tool_start",
            "name": "search_knowledge",
            "data": {"input": {"query": "test"}},
        }
        yield {"event": "on_tool_end", "name": "search_knowledge", "data": {"output": "result"}}

        # 3. Generation Tokens
        from langchain_core.messages import AIMessageChunk

        yield {"event": "on_chat_model_stream", "data": {"chunk": AIMessageChunk(content="Hello ")}}
        yield {
            "event": "on_chat_model_stream",
            "data": {"chunk": AIMessageChunk(content="streamed response")},
        }

        # 4. Final Thought
        yield {
            "event": "on_chain_end",
            "name": "response",
            "data": {"output": {"thought": "Final answer generated."}},
        }

    with patch(
        "app.api.v1.endpoints.chat.tutor_graph.astream_events", side_effect=mock_astream_events
    ), patch(
        "app.api.v1.endpoints.chat.get_supabase_client", return_value=object()
    ), patch(
        "app.api.v1.endpoints.chat.ChatService.update_latest_assistant_message_metadata",
        new=AsyncMock(),
    ):
        async with authenticated_client.stream(
            "POST",
            "/api/v1/chat/stream",
            json={
                "user_id": sample_user_id,
                "message": "hello",
                "session_id": "sess1",
                "tts_enabled": False,
            },
        ) as response:
            assert response.status_code == 200

            data_lines = []
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_lines.append(line[6:].strip())

            # Check for thought events
            thoughts = [json.loads(line) for line in data_lines if '"type": "thought"' in line]
            assert thoughts[0]["node"] == "router"
            assert "Router" in thoughts[0]["content"]
            assert thoughts[1]["node"] == "response"
            assert "Final answer generated" in thoughts[1]["content"]

            # Check for tool tracing
            status_events = [json.loads(line) for line in data_lines if '"type": "status"' in line]
            assert status_events[0]["node"] == "router"
            assert status_events[0]["phase"] == "start"
            assert "Running Router" in status_events[0]["content"]
            assert "Calling search_knowledge" in status_events[1]["content"]
            assert status_events[1]["tool_name"] == "search_knowledge"
            assert status_events[1]["meta"] == {"query": "test"}
            assert "Finished search_knowledge" in status_events[2]["content"]
            assert status_events[2]["phase"] == "complete"

            # Check for token events (should be streamed individually now)
            tokens = [
                json.loads(line)["content"] for line in data_lines if '"type": "token"' in line
            ]
            assert tokens == ["Hello ", "streamed response"]

            # Done event
            assert '"type": "done"' in data_lines[-1]


@pytest.mark.asyncio
async def test_persist_stream_traces_updates_latest_assistant_message():
    chat_service = AsyncMock()
    trace_events = [
        {"type": "status", "node": "router", "content": "Running Router", "phase": "start"},
        {"type": "thought", "node": "router", "content": "Router → sql: Need database lookup"},
    ]

    await _persist_stream_traces(
        chat_service,
        user_id="user-123",
        session_id="sess-traces",
        trace_events=trace_events,
        final_generation="Saved answer",
    )

    chat_service.update_latest_assistant_message_metadata.assert_awaited_once_with(
        "user-123",
        "sess-traces",
        {"traces": trace_events},
        content="Saved answer",
    )
