from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import RunnableLambda

from app.agents.tutor_agent.graph import tutor_graph
from app.agents.tutor_agent.nodes.router import RouteDecision


@pytest.mark.asyncio
async def test_graph_thought_tracing_observation():
    """QA-Observe: Verify that the graph produces observable thoughts through node events"""
    import time

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
        "route": None,
        "needs_human_approval": False,
        "human_approved": False,
        "start_time": time.time(),
    }

    mock_route = RouteDecision(route="memory", reasoning="Need memory info.")
    mock_generator_msg = AIMessage(content="Sakura is cherry blossom.")

    class MockLLM(RunnableLambda):
        def __init__(self):
            super().__init__(func=lambda x: AIMessage(content="default"))
            self.ainvoke = AsyncMock(side_effect=self._mock_ainvoke)
            self.invoke = MagicMock(side_effect=self._mock_invoke)

        def bind_tools(self, tools):
            return self

        def with_structured_output(self, schema):
            return self

        async def _mock_ainvoke(self, *args, **kwargs):
            return mock_route

        def _mock_invoke(self, *args, **kwargs):
            input_data = args[0] if args else kwargs.get("input")
            prompt_str = str(input_data)
            if "warm, and professional" in prompt_str:
                return mock_generator_msg
            if "Summarize" in prompt_str:
                return AIMessage(content="Summary")
            if "Extract entities" in prompt_str:
                return MagicMock(relationships=[])
            return AIMessage(content="default")

    mock_llm = MockLLM()

    with (
        patch("app.agents.tutor_agent.nodes.router.make_llm", return_value=mock_llm),
        patch("app.agents.tutor_agent.nodes.response_node.make_llm", return_value=mock_llm),
        patch("app.agents.tutor_agent.nodes.post_update.make_llm", return_value=mock_llm),
        patch("app.agents.tutor_agent.nodes.memory_node.ep_mem") as mock_ep,
        patch("app.agents.tutor_agent.nodes.memory_node.sem_mem") as mock_sem,
        patch("app.agents.tutor_agent.nodes.post_update.ep_mem"),
        patch("app.agents.tutor_agent.nodes.post_update.sem_mem"),
        patch("app.mcp.client.McpClient.call_tool", new_callable=AsyncMock) as m_call,
    ):
        mock_ep.search_episodic_memory.return_value = [
            MagicMock(text="User likes sakura", score=0.9)
        ]
        mock_sem.search_semantic_memory.return_value = []
        m_call.return_value = {}

        thoughts = []
        async for event in tutor_graph.astream_events(initial_state, version="v2"):
            name = event["name"]
            if event["event"] == "on_chain_end" and name in [
                "router", "memory", "decision", "response", "post_update"
            ]:
                output = event["data"].get("output")
                if isinstance(output, dict) and "thought" in output:
                    thoughts.append(output["thought"])

        assert len(thoughts) >= 3
        assert any("memory" in t.lower() for t in thoughts)
        assert any("Final answer" in t for t in thoughts)


@pytest.mark.asyncio
async def test_graph_completes_with_direct_route():
    """Verify graph completes for direct route (no worker nodes)."""
    import time

    initial_state = {
        "user_id": "u1",
        "jwt": "j1",
        "session_id": None,
        "user_input": "Hello!",
        "messages": [HumanMessage(content="Hello!")],
        "iterations": 0,
        "generation": "",
        "thought": "",
        "tts_enabled": False,
        "audio_file": None,
        "thread_context": "",
        "route": None,
        "needs_human_approval": False,
        "human_approved": False,
        "start_time": time.time(),
    }

    mock_route = RouteDecision(route="direct", reasoning="Simple greeting.")

    class MockLLM(RunnableLambda):
        def __init__(self):
            super().__init__(func=lambda x: AIMessage(content="default"))
            self.ainvoke = AsyncMock(return_value=mock_route)
            self.invoke = MagicMock(return_value=AIMessage(content="こんにちは！"))

        def bind_tools(self, tools):
            return self

        def with_structured_output(self, schema):
            return self

    mock_llm = MockLLM()

    with (
        patch("app.agents.tutor_agent.nodes.router.make_llm", return_value=mock_llm),
        patch("app.agents.tutor_agent.nodes.response_node.make_llm", return_value=mock_llm),
        patch("app.agents.tutor_agent.nodes.post_update.make_llm", return_value=mock_llm),
        patch("app.agents.tutor_agent.nodes.post_update.ep_mem"),
        patch("app.agents.tutor_agent.nodes.post_update.sem_mem"),
        patch("app.mcp.client.McpClient.call_tool", new_callable=AsyncMock),
    ):
        result = await tutor_graph.ainvoke(initial_state)
        assert result["generation"] != ""
