from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import RunnableLambda

from app.agents.memory_agent import memory_graph


@pytest.mark.asyncio
async def test_graph_thought_tracing_observation():
    """QA-Observe: Verify that the graph execution produces observable thoughts and tool events"""
    
    initial_state = {
        "user_id": "user-123",
        "jwt": "fake-jwt",
        "session_id": "sess-123",
        "user_input": "What is the meaning of 桜?",
        "messages": [HumanMessage(content="What is the meaning of 桜?")],
        "iterations": 0,
        "generation": "",
        "thought": "",
        "audio_file": None,
        "tts_enabled": False,
        "thread_context": "",
        "retrieved_episodic": "",
        "retrieved_semantic": "",
        "review_result": None,
        "rewritten_query": None,
        "plan": ""
    }

    # Mock Messages
    mock_planner_1 = AIMessage(content="", tool_calls=[{"name": "search_knowledge_units", "args": {"query": "桜"}, "id": "call_1"}])
    mock_planner_2 = AIMessage(content="Info gathered.")
    mock_reviewer_done = AIMessage(content="GENERATE")
    mock_generator_msg = AIMessage(content="Sakura is cherry blossom.")

    responses = [
        mock_planner_1,
        mock_planner_2,
        mock_reviewer_done,
        mock_generator_msg,
        # update_memory_node calls
        AIMessage(content="Summary"),
        MagicMock(dict=lambda: {"entities": [], "relationships": []}),
        MagicMock(has_note=False)
    ]

    def llm_logic(x):
        if responses:
            return responses.pop(0)
        return AIMessage(content="Fallback")

    # Mocks
    mock_llm = RunnableLambda(llm_logic)
    mock_llm.bind_tools = lambda tools: mock_llm
    mock_llm.with_structured_output = lambda schema: mock_llm

    with patch("app.agents.memory_agent.nodes.implementation.make_llm", return_value=mock_llm), \
         patch("app.agents.memory_agent.nodes.implementation.ep_mem"), \
         patch("app.agents.memory_agent.nodes.implementation.sem_mem"), \
         patch("app.core.domain_client.DomainClient") as mock_domain_cls:
        
        mock_domain = AsyncMock()
        mock_domain.get_chat_messages.return_value = []
        mock_domain_cls.return_value = mock_domain
        
        # Tool Mock
        mock_tool = MagicMock()
        mock_tool.name = "search_knowledge_units"
        mock_tool.is_async = True
        mock_tool.ainvoke = AsyncMock(return_value="Result")
        mock_tool.args = {"jwt": str, "query": str, "user_id": str}

        with patch("app.agents.memory_agent.TOOLS", [mock_tool]), \
             patch("app.agents.memory_agent.search_knowledge_units", mock_tool):
            
            thoughts = []
            async for event in memory_graph.astream_events(initial_state, version="v2"):
                name = event["name"]
                if event["event"] == "on_chain_end" and name in ["planner", "reviewer", "generate"]:
                    output = event["data"].get("output")
                    if isinstance(output, dict) and "thought" in output:
                        thoughts.append(output["thought"])

            assert len(thoughts) >= 3
            assert "search_knowledge_units" in thoughts[0]
            assert "sufficient" in thoughts[2].lower() or "answer" in thoughts[2].lower() # Index 2 is generator or second planner

@pytest.mark.asyncio
async def test_graph_loop_observation():
    """Simplified loop observation"""
    initial_state = {
        "user_id": "u1", "jwt": "j1", "user_input": "x", "messages": [HumanMessage(content="x")],
        "iterations": 0, "generation": "", "thought": "", "tts_enabled": False, "audio_file": None,
        "plan": "", "thread_context": "", "retrieved_episodic": "", "retrieved_semantic": ""
    }

    rs = [
        AIMessage(content="", tool_calls=[{"name": "search_knowledge_units", "args": {"q": "x"}, "id": "c1"}]),
        AIMessage(content="REWRITE search better"), # Reviewer
        AIMessage(content="Found"), # Planner (after rewrite)
        AIMessage(content="GENERATE"), # Reviewer
        AIMessage(content="Answer"), # Generator
        AIMessage(content="Sum"), # Update
        MagicMock(dict=lambda: {}), # Update
        MagicMock(has_note=False) # Update
    ]

    mock_llm = RunnableLambda(lambda x: rs.pop(0) if rs else AIMessage(content="..."))
    mock_llm.bind_tools = lambda tools: mock_llm
    mock_llm.with_structured_output = lambda schema: mock_llm

    with patch("app.agents.memory_agent.nodes.implementation.make_llm", return_value=mock_llm), \
         patch("app.agents.memory_agent.nodes.implementation.ep_mem"), \
         patch("app.agents.memory_agent.nodes.implementation.sem_mem"), \
         patch("app.core.domain_client.DomainClient"):
        
        mock_tool = MagicMock()
        mock_tool.name = "search_knowledge_units"
        mock_tool.is_async = True
        mock_tool.ainvoke = AsyncMock(return_value="R")
        mock_tool.args = {"jwt": str, "query": str, "user_id": str}

        with patch("app.agents.memory_agent.TOOLS", [mock_tool]):
            events = []
            async for event in memory_graph.astream_events(initial_state, version="v2"):
                events.append(event)
            
            rewrite_thoughts = [e["data"]["output"]["thought"] for e in events if e["event"] == "on_chain_end" and e["name"] == "rewrite" and "thought" in e["data"].get("output", {})]
            assert len(rewrite_thoughts) > 0
            assert "rewriting" in rewrite_thoughts[0].lower()
