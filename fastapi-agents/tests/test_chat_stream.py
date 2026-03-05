import json
from unittest.mock import patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_chat_stream(authenticated_client: AsyncClient, sample_user_id: str):
    """QA-Streaming: Test the SSE /chat/stream endpoint"""

    # Yield dummy events out of the memory agent
    async def mock_astream_events(*args, **kwargs):
        # 1. Thread context/Planner start
        yield {"event": "on_chain_start", "name": "planner", "data": {}}
        yield {
            "event": "on_chain_end",
            "name": "planner",
            "data": {"output": {"thought": "I decided to use these tools: ['search_knowledge']"}},
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
            "name": "generate",
            "data": {"output": {"thought": "Final answer generated."}},
        }

    with patch(
        "app.api.v1.endpoints.chat.memory_graph.astream_events", side_effect=mock_astream_events
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
            thoughts = [line for line in data_lines if '"type": "thought"' in line]
            assert "I decided to use these tools" in thoughts[0]
            assert "Final answer generated" in thoughts[1]

            # Check for tool tracing
            status_events = [line for line in data_lines if '"type": "status"' in line]
            assert "Calling search_knowledge" in status_events[0]
            assert "Finished search_knowledge" in status_events[1]

            # Check for token events (should be streamed individually now)
            tokens = [
                json.loads(line)["content"] for line in data_lines if '"type": "token"' in line
            ]
            assert tokens == ["Hello ", "streamed response"]

            # Done event
            assert '"type": "done"' in data_lines[-1]
