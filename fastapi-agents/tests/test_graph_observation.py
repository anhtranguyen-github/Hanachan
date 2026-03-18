from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableLambda

from app.agents.memory_agent import memory_graph
from app.agents.memory_agent.nodes.implementation import WorkerDispatch


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
        "plan": "",
        "active_workers": [],
        "current_worker": None,
    }

    # Mock responses for different nodes
    mock_orchestrator_dispatch = WorkerDispatch(workers=["memory_worker"], reasoning="Need memory info.")
    mock_orchestrator_empty = WorkerDispatch(workers=[], reasoning="Done.")
    mock_memory_worker_msg = AIMessage(
        content="",
        tool_calls=[{"name": "get_episodic_memory", "args": {"query": "桜"}, "id": "call_1"}],
    )
    mock_reviewer_done = AIMessage(content="GENERATE")
    mock_generator_msg = AIMessage(content="Sakura is cherry blossom.")

    responses = {
        "orchestrator_initial": mock_orchestrator_dispatch,
        "orchestrator_empty": mock_orchestrator_empty,
        "memory_worker": mock_memory_worker_msg,
        "reviewer": mock_reviewer_done,
        "generate": mock_generator_msg,
        "update_summary": AIMessage(content="Summary"),
        "update_kg": MagicMock(relationships=[]),
        "update_note": MagicMock(has_note=False),
    }

    class MockLLM(RunnableLambda):
        def __init__(self):
            super().__init__(func=self._mock_call)
            self.ainvoke = AsyncMock(side_effect=self._mock_ainvoke)
            self.invoke = MagicMock(side_effect=self._mock_invoke)
            self.planner_calls = 0
            self.orchestrator_calls = 0

        def _mock_call(self, *args, **kwargs):
            return AIMessage(content="default")

        def bind_tools(self, tools):
            return self

        def with_structured_output(self, schema):
            return self

        async def _mock_ainvoke(self, *args, **kwargs):
            input_data = args[0] if args else kwargs.get("input")
            prompt_str = str(input_data)
            
            if "specialized workers" in prompt_str:
                self.orchestrator_calls += 1
                if self.orchestrator_calls == 1:
                    return responses["orchestrator_initial"]
                else:
                    return responses["orchestrator_empty"]
            
            if "Memory Specialist" in prompt_str:
                self.planner_calls += 1
                if self.planner_calls == 1:
                    return responses["memory_worker"]
                else:
                    return AIMessage(content="Information gathered.")
                
            return AIMessage(content="default")

        def _mock_invoke(self, *args, **kwargs):
            input_data = args[0] if args else kwargs.get("input")
            prompt_str = str(input_data)
            
            if "reviewer" in prompt_str or "Decision Rules" in prompt_str:
                return responses["reviewer"]
            if "warm, and professional" in prompt_str:
                return responses["generate"]
            if "Summarize" in prompt_str:
                return responses["update_summary"]
            if "Extract entities" in prompt_str:
                return responses["update_kg"]
            if "Review this AI response" in prompt_str:
                return responses["update_note"]
            return AIMessage(content="default")

    mock_llm = MockLLM()

    with (
        patch("app.agents.memory_agent.nodes.implementation.make_llm", return_value=mock_llm),
        patch("app.agents.memory_agent.nodes.workers.make_llm", return_value=mock_llm),
        patch("app.agents.memory_agent.nodes.implementation.ep_mem"),
        patch("app.agents.memory_agent.nodes.implementation.sem_mem"),
        patch("app.core.core_client.CoreClient") as mock_core_cls,
    ):
        mock_core = AsyncMock()
        mock_core.get_chat_messages.return_value = []
        mock_core_cls.return_value = mock_core

        # Tool Mock
        mock_tool = MagicMock()
        mock_tool.name = "get_episodic_memory"
        mock_tool.is_async = True
        mock_tool.ainvoke = AsyncMock(return_value="Result")
        mock_tool.args = {"query": str, "user_id": str}

        with (
            patch("app.mcp.client.McpClient.call_tool", new_callable=AsyncMock) as m_call,
            patch("app.agents.memory_agent.nodes.implementation.TOOLS", [mock_tool]),
            patch("app.agents.memory_agent.nodes.workers.get_episodic_memory", mock_tool),
        ):
            m_call.return_value = {}
            thoughts = []
            async for event in memory_graph.astream_events(initial_state, version="v2"):
                name = event["name"]
                if event["event"] == "on_chain_end" and name in ["orchestrator", "reviewer", "generate"]:
                    output = event["data"].get("output")
                    if isinstance(output, dict) and "thought" in output:
                        thoughts.append(output["thought"])

            # 1. Orchestrator dispatching to memory_worker
            # 2. Orchestrator finishing after memory_worker pops
            # 3. Reviewer sufficient
            # 4. Generator final
            assert len(thoughts) >= 3
            assert any("dispatching to: ['memory_worker']" in t for t in thoughts)
            assert any("sufficient" in t.lower() for t in thoughts)
            assert any("Final answer" in t for t in thoughts)


@pytest.mark.asyncio
async def test_graph_loop_observation():
    """Simplified loop observation"""
    initial_state = {
        "user_id": "u1",
        "jwt": "j1",
        "user_input": "x",
        "messages": [HumanMessage(content="x")],
        "iterations": 0,
        "generation": "",
        "thought": "",
        "tts_enabled": False,
        "audio_file": None,
        "plan": "",
        "thread_context": "",
        "retrieved_episodic": "",
        "retrieved_semantic": "",
        "active_workers": [],
        "current_worker": None,
    }

    # Responses sequence
    orchestrator_initial = WorkerDispatch(workers=["memory_worker"], reasoning="r")
    orchestrator_empty = WorkerDispatch(workers=[], reasoning="done")
    memory_worker_res = AIMessage(content="", tool_calls=[{"name": "get_episodic_memory", "args": {"query": "x"}, "id": "c1"}])
    reviewer_rewrite = AIMessage(content="REWRITE search better")
    reviewer_generate = AIMessage(content="GENERATE")
    generator_res = AIMessage(content="Answer")

    class MockLLM(RunnableLambda):
        def __init__(self):
            super().__init__(func=self._mock_call)
            self.ainvoke = AsyncMock(side_effect=self._mock_ainvoke)
            self.invoke = MagicMock(side_effect=self._mock_invoke)
            self.reviewer_calls = 0
            self.memory_worker_calls = 0
            self.orchestrator_calls = 0

        def _mock_call(self, *args, **kwargs):
            return AIMessage(content="default")

        def bind_tools(self, tools):
            return self

        def with_structured_output(self, schema):
            return self

        async def _mock_ainvoke(self, *args, **kwargs):
            input_data = args[0] if args else kwargs.get("input")
            prompt_str = str(input_data)
            
            if "specialized workers" in prompt_str:
                self.orchestrator_calls += 1
                if self.orchestrator_calls % 2 != 0:
                    return orchestrator_initial
                else:
                    return orchestrator_empty

            if "Memory Specialist" in prompt_str:
                self.memory_worker_calls += 1
                if self.memory_worker_calls % 2 != 0:
                    return memory_worker_res
                else:
                    return AIMessage(content="Found")
                
            return AIMessage(content="...")

        def _mock_invoke(self, *args, **kwargs):
            input_data = args[0] if args else kwargs.get("input")
            prompt_str = str(input_data)
            
            if "reviewer" in prompt_str:
                self.reviewer_calls += 1
                if self.reviewer_calls == 1:
                    return reviewer_rewrite
                return reviewer_generate
            if "warm, and professional" in prompt_str:
                return generator_res
            if "Review this AI response" in prompt_str:
                return MagicMock(has_note=False)
            return AIMessage(content="...")

    mock_llm = MockLLM()

    with (
        patch("app.agents.memory_agent.nodes.implementation.make_llm", return_value=mock_llm),
        patch("app.agents.memory_agent.nodes.workers.make_llm", return_value=mock_llm),
        patch("app.agents.memory_agent.nodes.implementation.ep_mem"),
        patch("app.agents.memory_agent.nodes.implementation.sem_mem"),
        patch("app.core.core_client.CoreClient"),
    ):
        mock_tool = MagicMock()
        mock_tool.name = "get_episodic_memory"
        mock_tool.is_async = True
        mock_tool.ainvoke = AsyncMock(return_value="R")
        mock_tool.args = {"query": str, "user_id": str}

        with (
            patch("app.mcp.client.McpClient.call_tool", new_callable=AsyncMock) as m_call,
            patch("app.agents.memory_agent.nodes.implementation.TOOLS", [mock_tool]),
            patch("app.agents.memory_agent.nodes.workers.get_episodic_memory", mock_tool),
        ):
            m_call.return_value = {}
            events = []
            async for event in memory_graph.astream_events(initial_state, version="v2"):
                events.append(event)

            # Node outputs are captured by name
            reviewer_outputs = [
                e["data"]["output"]
                for e in events
                if e["event"] == "on_chain_end"
                and e["name"] == "reviewer"
                and isinstance(e["data"].get("output"), dict)
            ]
            
            rewrite_hits = [o for o in reviewer_outputs if o.get("review_result") == "rewrite"]
            assert len(rewrite_hits) > 0
            assert "incomplete" in rewrite_hits[0]["thought"].lower()
