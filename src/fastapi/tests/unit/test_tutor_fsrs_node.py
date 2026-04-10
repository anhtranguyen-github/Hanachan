from __future__ import annotations

import importlib

import pytest

fsrs_node_module = importlib.import_module("app.agents.tutor_agent.nodes.fsrs_node")


@pytest.mark.asyncio
async def test_fsrs_node_prepares_learn_card_deterministically(monkeypatch):
    async def _fake_prepare(**kwargs):
        return "Study card ready.\nMode: learn\nPrompt: What is 猫?"

    async def _fake_active_card(*args, **kwargs):
        return None

    monkeypatch.setattr(fsrs_node_module, "_peek_active_study_card", _fake_active_card)
    monkeypatch.setattr(fsrs_node_module.prepare_study_card, "coroutine", _fake_prepare)

    result = await fsrs_node_module.fsrs_node(
        {
            "user_input": "i want to learn",
            "user_id": "cli-user",
            "session_id": "session-1",
            "persist_artifacts": False,
            "messages": [],
        }
    )

    assert "prepared learn study card" in result["thought"].lower()
    assert "Study card ready." in result["messages"][0].content


@pytest.mark.asyncio
async def test_fsrs_node_evaluates_active_card_answer_deterministically(monkeypatch):
    async def _fake_active_card(*args, **kwargs):
        return {"item_id": "ku-1"}

    async def _fake_evaluate(**kwargs):
        return "Correct.\nItem ID: ku-1"

    monkeypatch.setattr(fsrs_node_module, "_peek_active_study_card", _fake_active_card)
    monkeypatch.setattr(fsrs_node_module.evaluate_study_answer, "coroutine", _fake_evaluate)

    result = await fsrs_node_module.fsrs_node(
        {
            "user_input": "cat",
            "user_id": "cli-user",
            "session_id": "session-1",
            "persist_artifacts": False,
            "messages": [],
        }
    )

    assert "evaluated answer" in result["thought"].lower()
    assert "Correct." in result["messages"][0].content
