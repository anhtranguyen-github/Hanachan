import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from langchain_core.messages import AIMessage
from app.agents.tutor_agent.nodes.fsrs_node import fsrs_node
from app.agents.tutor_agent.state import TutorState

@pytest.mark.asyncio
async def test_fsrs_node_logic():
    # Mock state
    state: TutorState = {
        "messages": [],
        "user_id": "user-123",
        "jwt": "fake-jwt",
        "iterations": 0,
        "start_time": 0.0,
        "user_input": "What did I study recently?",
        "session_id": None,
        "route": "fsrs",
        "thought": "",
        "needs_human_approval": False,
        "human_approved": False,
        "thread_context": "",
        "generation": "",
        "audio_file": None,
        "tts_enabled": False,
    }

    # Mock LLM response (no tool calls → direct response)
    mock_response = AIMessage(content="Gathering FSRS data.")

    with patch("app.agents.tutor_agent.nodes.fsrs_node.make_llm") as mock_make_llm:
        mock_llm = MagicMock()
        mock_make_llm.return_value = mock_llm
        mock_llm.bind_tools.return_value = mock_llm
        mock_llm.ainvoke = AsyncMock(return_value=mock_response)

        result = await fsrs_node(state)

        assert "messages" in result
        assert len(result["messages"]) == 1
        assert result["messages"][0].content == "Gathering FSRS data."
        assert "thought" in result
        assert "FSRS node" in result["thought"]

        # Verify tools binding
        mock_llm.bind_tools.assert_called_once()
