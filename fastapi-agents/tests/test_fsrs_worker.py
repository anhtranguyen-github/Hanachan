import pytest
from unittest.mock import AsyncMock, patch
from langchain_core.messages import AIMessage
from app.agents.memory_agent.nodes.workers import fsrs_worker_node
from app.agents.memory_agent.state import AgentState

@pytest.mark.asyncio
async def test_fsrs_worker_node_logic():
    # Mock state
    state: AgentState = {
        "messages": [],
        "user_id": "user-123",
        "jwt": "fake-jwt",
        "iterations": 0,
        "active_workers": ["fsrs_worker"],
        "start_time": 0.0,
    }
    
    # Mock LLM response
    mock_response = AIMessage(content="Gathering FSRS data.", tool_calls=[{"name": "get_recent_reviews", "args": {"limit": 5}, "id": "call_1"}])
    
    from unittest.mock import MagicMock
    with patch("app.agents.memory_agent.nodes.workers.make_llm") as mock_make_llm:
        mock_llm = MagicMock()
        mock_make_llm.return_value = mock_llm
        mock_llm.bind_tools.return_value = mock_llm
        mock_llm.ainvoke = AsyncMock(return_value=mock_response)
        
        result = await fsrs_worker_node(state)
        
        assert "messages" in result
        assert len(result["messages"]) == 1
        assert result["messages"][0].content == "Gathering FSRS data."
        assert "thought" in result
        assert "FSRS worker" in result["thought"]
        
        # Verify tools binding
        mock_llm.bind_tools.assert_called_once()
