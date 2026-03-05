"""
Functional QA Tests for the Memory Agent Graph.

These tests verify that the agent graph:
- Calls the correct tools for different user intents
- Passes context (episodic, semantic, thread) through the graph
- Produces a non-empty generation
- Completes without errors

These are NOT semantic quality tests — they test plumbing, not prose.
"""

from __future__ import annotations

import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import RunnableLambda

from app.agents.memory_agent import memory_graph

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

OPENAI_KEY = os.environ.get("OPENAI_API_KEY", "")
HAS_OPENAI = OPENAI_KEY != "" and "sk-test-key" not in OPENAI_KEY


def _make_mock_llm(responses: list):
    """Build a mock LLM that pops pre-defined responses in sequence."""
    rs = list(responses)
    mock_llm = RunnableLambda(lambda x: rs.pop(0) if rs else AIMessage(content="..."))
    mock_llm.bind_tools = lambda tools: mock_llm
    mock_llm.with_structured_output = lambda schema: mock_llm
    return mock_llm


def _base_state(**overrides) -> dict:
    """Return a minimal valid AgentState dict."""
    state = {
        "user_id": "test-user-001",
        "jwt": "fake-jwt",
        "user_input": "",
        "messages": [],
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
    }
    state.update(overrides)
    return state


# Standard patches for all tests (Domain client + memory backends)
def _common_patches():
    """Return a dict of common patch targets."""
    return {
        "domain_client": patch("app.core.domain_client.DomainClient"),
        "mcp_call": patch(
            "app.services.mcp_domain_client.MCPDomainClient.call_tool",
            new_callable=AsyncMock,
        ),
        "ep_mem_search": patch(
            "app.agents.memory_agent.nodes.implementation.ep_mem.search_episodic_memory"
        ),
        "sem_mem_search": patch(
            "app.agents.memory_agent.nodes.implementation.sem_mem.search_semantic_memory"
        ),
        "make_llm": patch("app.agents.memory_agent.nodes.implementation.make_llm"),
    }


# ---------------------------------------------------------------------------
# 1. Graph completes and produces output
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

    patches = _common_patches()
    with (
        patches["domain_client"] as mock_dc,
        patches["mcp_call"] as mock_mcp,
        patches["ep_mem_search"] as mock_ep,
        patches["sem_mem_search"] as mock_sem,
        patches["make_llm"] as mock_make_llm,
    ):
        mock_dc.return_value = AsyncMock(get_chat_messages=AsyncMock(return_value=[]))
        mock_mcp.return_value = ""
        mock_ep.return_value = []
        mock_sem.return_value = []

        mock_make_llm.return_value = _make_mock_llm(
            [
                AIMessage(content="Simple greeting, no tools needed."),  # Planner
                AIMessage(content="GENERATE"),  # Reviewer
                AIMessage(content="こんにちは！元気ですか？"),  # Generator
                AIMessage(content="Summary"),  # Summary update
                MagicMock(),  # KG update
                MagicMock(),  # Note update
            ]
        )

        final = await memory_graph.ainvoke(state)

        assert final["generation"] != "", "Graph must produce a non-empty generation"
        assert isinstance(final["generation"], str)


# ---------------------------------------------------------------------------
# 2. Tool invocation: episodic memory retrieval
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_episodic_memory_tool_called():
    """
    [QA-Func-02] When the planner calls get_episodic_memory,
    it should invoke ep_mem.search_episodic_memory.
    """
    user_input = "Hôm qua chúng ta đã bàn về cái gì nhỉ?"
    state = _base_state(
        user_input=user_input,
        messages=[HumanMessage(content=user_input)],
    )

    patches = _common_patches()
    with (
        patches["domain_client"] as mock_dc,
        patches["mcp_call"] as mock_mcp,
        patches["ep_mem_search"] as mock_ep,
        patches["sem_mem_search"] as mock_sem,
        patches["make_llm"] as mock_make_llm,
    ):
        mock_dc.return_value = AsyncMock(get_chat_messages=AsyncMock(return_value=[]))
        mock_mcp.return_value = ""
        mock_ep.return_value = [
            MagicMock(text="Yesterday we discussed Wa vs Ga", score=0.95),
        ]
        mock_sem.return_value = []

        # Planner emits a tool_call for get_episodic_memory
        planner_msg = AIMessage(
            content="",
            tool_calls=[
                {
                    "id": "call_1",
                    "name": "get_episodic_memory",
                    "args": {"query": "yesterday discussion", "user_id": "INJECTED"},
                }
            ],
        )
        mock_make_llm.return_value = _make_mock_llm(
            [
                planner_msg,  # Planner calls tool
                AIMessage(content="GENERATE"),  # Reviewer
                AIMessage(
                    content="Yesterday we discussed the difference between Wa and Ga particles."
                ),
                AIMessage(content="Sum"),
                MagicMock(),
                MagicMock(),
            ]
        )

        final = await memory_graph.ainvoke(state)

        # Verify: episodic memory search was called
        mock_ep.assert_called_once()
        call_args = mock_ep.call_args
        assert call_args[0][0] == "test-user-001"  # user_id injected
        # Verify: generation produced
        assert final["generation"] != ""


# ---------------------------------------------------------------------------
# 3. Tool invocation: semantic knowledge retrieval
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_semantic_facts_tool_called():
    """
    [QA-Func-03] When the planner calls get_semantic_facts,
    it should invoke sem_mem.search_semantic_memory.
    """
    user_input = "Bạn biết gì về tôi?"
    state = _base_state(
        user_input=user_input,
        messages=[HumanMessage(content=user_input)],
    )

    patches = _common_patches()
    with (
        patches["domain_client"] as mock_dc,
        patches["mcp_call"] as mock_mcp,
        patches["ep_mem_search"] as mock_ep,
        patches["sem_mem_search"] as mock_sem,
        patches["make_llm"] as mock_make_llm,
    ):
        mock_dc.return_value = AsyncMock(get_chat_messages=AsyncMock(return_value=[]))
        mock_mcp.return_value = ""
        mock_ep.return_value = []
        mock_sem.return_value = [
            {"source": {"id": "user-001"}, "relationship": "LIVES_IN", "target": {"id": "Tokyo"}},
        ]

        planner_msg = AIMessage(
            content="",
            tool_calls=[
                {
                    "id": "call_2",
                    "name": "get_semantic_facts",
                    "args": {"keywords": ["about me", "profile"], "user_id": "INJECTED"},
                }
            ],
        )
        mock_make_llm.return_value = _make_mock_llm(
            [
                planner_msg,
                AIMessage(content="GENERATE"),
                AIMessage(content="You live in Tokyo and are studying for JLPT N2!"),
                AIMessage(content="Sum"),
                MagicMock(),
                MagicMock(),
            ]
        )

        final = await memory_graph.ainvoke(state)

        # Verify: semantic memory search was called
        mock_sem.assert_called_once()
        assert final["generation"] != ""


# ---------------------------------------------------------------------------
# 4. Tool invocation: learning progress (MCP)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_learning_progress_tool_called():
    """
    [QA-Func-04] When the planner calls get_user_learning_progress,
    it should invoke MCPDomainClient.call_tool.
    """
    user_input = "Tiến độ học chữ 桜 của tôi thế nào?"
    state = _base_state(
        user_input=user_input,
        messages=[HumanMessage(content=user_input)],
    )

    patches = _common_patches()
    with (
        patches["domain_client"] as mock_dc,
        patches["mcp_call"] as mock_mcp,
        patches["ep_mem_search"] as mock_ep,
        patches["sem_mem_search"] as mock_sem,
        patches["make_llm"] as mock_make_llm,
    ):
        mock_dc.return_value = AsyncMock(get_chat_messages=AsyncMock(return_value=[]))
        mock_mcp.return_value = "Level: N4, Active items: 120, Due today: 15"
        mock_ep.return_value = []
        mock_sem.return_value = []

        planner_msg = AIMessage(
            content="",
            tool_calls=[
                {
                    "id": "call_3",
                    "name": "get_user_learning_progress",
                    "args": {"identifier": "桜", "user_id": "INJECTED", "jwt": "fake-jwt"},
                }
            ],
        )
        mock_make_llm.return_value = _make_mock_llm(
            [
                planner_msg,
                AIMessage(content="GENERATE"),
                AIMessage(content="You are N4 level with 15 items due today."),
                AIMessage(content="Sum"),
                MagicMock(),
                MagicMock(),
            ]
        )

        final = await memory_graph.ainvoke(state)

        # Verify: MCP call was made
        mock_mcp.assert_called()
        assert final["generation"] != ""


# ---------------------------------------------------------------------------
# 5. Context passthrough: thread_context preserved through graph
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_thread_context_preserved():
    """
    [QA-Func-05] thread_context from the state should survive the graph execution.
    """
    user_input = "Nên học gì tiếp?"
    state = _base_state(
        user_input=user_input,
        messages=[HumanMessage(content=user_input)],
        thread_context="User is JLPT N5, currently learning hiragana.",
    )

    patches = _common_patches()
    with (
        patches["domain_client"] as mock_dc,
        patches["mcp_call"] as mock_mcp,
        patches["ep_mem_search"] as mock_ep,
        patches["sem_mem_search"] as mock_sem,
        patches["make_llm"] as mock_make_llm,
    ):
        mock_dc.return_value = AsyncMock(get_chat_messages=AsyncMock(return_value=[]))
        mock_mcp.return_value = ""
        mock_ep.return_value = []
        mock_sem.return_value = []

        mock_make_llm.return_value = _make_mock_llm(
            [
                AIMessage(content="User is N5 learning hiragana, simple advice."),
                AIMessage(content="GENERATE"),
                AIMessage(content="You should learn katakana next!"),
                AIMessage(content="Sum"),
                MagicMock(),
                MagicMock(),
            ]
        )

        final = await memory_graph.ainvoke(state)

        assert final["generation"] != ""
        assert final["thread_context"] == "User is JLPT N5, currently learning hiragana."


# ---------------------------------------------------------------------------
# 6. Reviewer triggers rewrite loop
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_reviewer_rewrite_loop():
    """
    [QA-Func-06] When the reviewer says REWRITE, the graph should loop back
    through the rewriter node, then re-plan, and eventually generate.
    """
    user_input = "Giải thích ngữ pháp ている"
    state = _base_state(
        user_input=user_input,
        messages=[HumanMessage(content=user_input)],
    )

    patches = _common_patches()
    with (
        patches["domain_client"] as mock_dc,
        patches["mcp_call"] as mock_mcp,
        patches["ep_mem_search"] as mock_ep,
        patches["sem_mem_search"] as mock_sem,
        patches["make_llm"] as mock_make_llm,
    ):
        mock_dc.return_value = AsyncMock(get_chat_messages=AsyncMock(return_value=[]))
        mock_mcp.return_value = "ている grammar: ongoing action"
        mock_ep.return_value = []
        mock_sem.return_value = []

        planner_tool = AIMessage(
            content="",
            tool_calls=[
                {
                    "id": "call_rw",
                    "name": "search_knowledge_units",
                    "args": {"query": "ている grammar", "user_id": "INJECTED", "jwt": "fake-jwt"},
                }
            ],
        )
        mock_make_llm.return_value = _make_mock_llm(
            [
                planner_tool,  # 1st planner: calls tool
                AIMessage(content="REWRITE: search for te-iru form"),  # Reviewer: REWRITE
                AIMessage(content="Let me search again."),  # 2nd planner (after rewrite)
                AIMessage(content="GENERATE"),  # Reviewer: GENERATE
                AIMessage(content="ている expresses ongoing actions."),  # Generator
                AIMessage(content="Sum"),
                MagicMock(),
                MagicMock(),
            ]
        )

        final = await memory_graph.ainvoke(state)

        assert final["generation"] != ""
        # The graph should have gone through rewrite (iterations > 0)
        assert final["iterations"] >= 1
