"""
Functional QA Tests for the Tutor Agent Graph.

These tests verify that the agent graph:
- Calls the correct tools for different user intents
- Passes context (episodic, semantic, thread) through the graph
- Produces a non-empty generation
- Completes without errors

These are NOT semantic quality tests — they test plumbing, not prose.
"""

from __future__ import annotations

import time
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import RunnableLambda

from app.agents.tutor_agent.graph import tutor_graph
from app.agents.tutor_agent.nodes.router import RouteDecision

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _base_state(**overrides) -> dict:
    """Return a minimal valid TutorState dict."""
    state = {
        "user_id": "test-user-001",
        "jwt": "fake-jwt",
        "session_id": None,
        "user_input": "",
        "messages": [],
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
    state.update(overrides)
    return state


class MockLLM(RunnableLambda):
    """A mock LLM that can be configured per test."""

    def __init__(self, route_decision=None, generation_text="default", summary_text="Summary"):
        super().__init__(func=lambda x: AIMessage(content="default"))
        self._route = route_decision or RouteDecision(route="direct", reasoning="default")
        self._generation = generation_text
        self._summary = summary_text
        self.ainvoke = AsyncMock(side_effect=self._async_invoke)
        self.invoke = MagicMock(side_effect=self._sync_invoke)

    def bind_tools(self, tools):
        return self

    def with_structured_output(self, schema):
        return self

    async def _async_invoke(self, *args, **kwargs):
        return self._route

    def _sync_invoke(self, *args, **kwargs):
        input_data = args[0] if args else kwargs.get("input")
        prompt_str = str(input_data)
        if "warm, and professional" in prompt_str:
            return AIMessage(content=self._generation)
        if "Summarize" in prompt_str:
            return AIMessage(content=self._summary)
        if "Extract entities" in prompt_str:
            return MagicMock(relationships=[])
        return AIMessage(content="default")


def _common_patches(mock_llm):
    """Return a context manager stack for standard patches."""
    return (
        patch("app.agents.tutor_agent.nodes.router.make_llm", return_value=mock_llm),
        patch("app.agents.tutor_agent.nodes.response_node.make_llm", return_value=mock_llm),
        patch("app.agents.tutor_agent.nodes.post_update.make_llm", return_value=mock_llm),
        patch("app.agents.tutor_agent.nodes.memory_node.ep_mem"),
        patch("app.agents.tutor_agent.nodes.memory_node.sem_mem"),
        patch("app.agents.tutor_agent.nodes.post_update.ep_mem"),
        patch("app.agents.tutor_agent.nodes.post_update.sem_mem"),
        patch("app.mcp.client.McpClient.call_tool", new_callable=AsyncMock, return_value={}),
    )


# ---------------------------------------------------------------------------
# 1. Graph completes and produces output (direct route)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_graph_completes_with_output():
    """
    [QA-Func-01] The graph should run to completion and produce a non-empty generation.
    """
    user_input = "こんにちは！"
    state = _base_state(
        user_input=user_input,
        messages=[HumanMessage(content=user_input)],
    )

    mock_llm = MockLLM(
        route_decision=RouteDecision(route="direct", reasoning="Simple greeting."),
        generation_text="こんにちは！元気ですか？",
    )
    patches = _common_patches(mock_llm)
    with patches[0], patches[1], patches[2], patches[3], patches[4], patches[5], patches[6], patches[7]:
        final = await tutor_graph.ainvoke(state)

        assert final["generation"] != "", "Graph must produce a non-empty generation"
        assert isinstance(final["generation"], str)


# ---------------------------------------------------------------------------
# 2. Memory route: episodic memory retrieval
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_episodic_memory_called_via_memory_route():
    """
    [QA-Func-02] When router selects 'memory', the memory_node should call
    ep_mem.search_episodic_memory.
    """
    user_input = "What did we discuss yesterday?"
    state = _base_state(
        user_input=user_input,
        messages=[HumanMessage(content=user_input)],
    )

    mock_llm = MockLLM(
        route_decision=RouteDecision(route="memory", reasoning="Past conversation."),
        generation_text="Yesterday we discussed Wa vs Ga particles.",
    )
    patches = _common_patches(mock_llm)
    with patches[0], patches[1], patches[2], patches[3] as mock_ep, patches[4] as mock_sem, patches[5], patches[6], patches[7]:
        mock_ep.search_episodic_memory.return_value = [
            MagicMock(text="Yesterday we discussed Wa vs Ga", score=0.95),
        ]
        mock_sem.search_semantic_memory.return_value = []

        final = await tutor_graph.ainvoke(state)

        mock_ep.search_episodic_memory.assert_called_once()
        call_args = mock_ep.search_episodic_memory.call_args
        assert call_args[0][0] == "test-user-001"
        assert final["generation"] != ""


# ---------------------------------------------------------------------------
# 3. Memory route: semantic knowledge retrieval
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_semantic_facts_called_via_memory_route():
    """
    [QA-Func-03] When router selects 'memory', the memory_node should call
    sem_mem.search_semantic_memory.
    """
    user_input = "What do you know about me?"
    state = _base_state(
        user_input=user_input,
        messages=[HumanMessage(content=user_input)],
    )

    mock_llm = MockLLM(
        route_decision=RouteDecision(route="memory", reasoning="Personal facts."),
        generation_text="You live in Tokyo and study for JLPT N2!",
    )
    patches = _common_patches(mock_llm)
    with patches[0], patches[1], patches[2], patches[3] as mock_ep, patches[4] as mock_sem, patches[5], patches[6], patches[7]:
        mock_ep.search_episodic_memory.return_value = []
        mock_sem.search_semantic_memory.return_value = [
            {"source": {"id": "user-001"}, "relationship": "LIVES_IN", "target": {"id": "Tokyo"}},
        ]

        final = await tutor_graph.ainvoke(state)

        mock_sem.search_semantic_memory.assert_called_once()
        assert final["generation"] != ""


# ---------------------------------------------------------------------------
# 4. FSRS route dispatched
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_fsrs_route_dispatched():
    """
    [QA-Func-04] When router selects 'fsrs', the graph should complete and produce output.
    """
    user_input = "What is my progress on 桜?"
    state = _base_state(
        user_input=user_input,
        messages=[HumanMessage(content=user_input)],
    )

    mock_llm = MockLLM(
        route_decision=RouteDecision(route="fsrs", reasoning="Learning progress query."),
        generation_text="You are N4 level with 15 items due today.",
    )
    patches = _common_patches(mock_llm)
    with patches[0], patches[1], patches[2], patches[3], patches[4], patches[5], patches[6], patches[7]:
        final = await tutor_graph.ainvoke(state)
        assert final["generation"] != ""


# ---------------------------------------------------------------------------
# 5. Context passthrough: thread_context preserved
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_thread_context_preserved():
    """
    [QA-Func-05] thread_context from the state should survive the graph execution.
    """
    user_input = "What should I learn next?"
    state = _base_state(
        user_input=user_input,
        messages=[HumanMessage(content=user_input)],
        thread_context="User is JLPT N5, currently learning hiragana.",
    )

    mock_llm = MockLLM(
        route_decision=RouteDecision(route="direct", reasoning="Simple advice."),
        generation_text="You should learn katakana next!",
    )
    patches = _common_patches(mock_llm)
    with patches[0], patches[1], patches[2], patches[3], patches[4], patches[5], patches[6], patches[7]:
        final = await tutor_graph.ainvoke(state)

        assert final["generation"] != ""
        assert final["thread_context"] == "User is JLPT N5, currently learning hiragana."


# ---------------------------------------------------------------------------
# 6. Decision loop: needs_more triggers re-routing
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_decision_loops_back_when_no_context():
    """
    [QA-Func-06] When the decision node finds no context after a direct route,
    it should loop back via needs_more. The second iteration routes to memory
    and gathers context, then proceeds.
    """
    user_input = "Explain ている grammar"
    state = _base_state(
        user_input=user_input,
        messages=[HumanMessage(content=user_input)],
    )

    call_count = 0

    async def route_sequence(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            return RouteDecision(route="direct", reasoning="Try direct first.")
        return RouteDecision(route="memory", reasoning="Need more context.")

    mock_llm = MockLLM(
        generation_text="ている expresses ongoing actions.",
    )
    mock_llm.ainvoke = AsyncMock(side_effect=route_sequence)

    patches = _common_patches(mock_llm)
    with patches[0], patches[1], patches[2], patches[3] as mock_ep, patches[4] as mock_sem, patches[5], patches[6], patches[7]:
        mock_ep.search_episodic_memory.return_value = [
            MagicMock(text="ている grammar: ongoing action", score=0.9),
        ]
        mock_sem.search_semantic_memory.return_value = []

        final = await tutor_graph.ainvoke(state)

        assert final["generation"] != ""
        assert final["iterations"] >= 2
