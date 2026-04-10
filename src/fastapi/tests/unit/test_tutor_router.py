from __future__ import annotations

import pytest

from app.agents.tutor_agent.nodes.router import router_node


@pytest.mark.asyncio
async def test_router_routes_learn_request_to_fsrs():
    result = await router_node(
        {
            "user_input": "i want to learn",
            "user_id": "cli-user",
            "session_id": "session-1",
            "persist_artifacts": False,
            "messages": [],
            "iterations": 0,
        }
    )

    assert result["route"] == "fsrs"
    assert "keyword" in result["thought"].lower()


@pytest.mark.asyncio
async def test_router_routes_active_study_answer_to_fsrs(monkeypatch):
    async def _fake_active_card(*args, **kwargs):
        return {"item_id": "ku-1", "prompt": "What is 猫?"}

    monkeypatch.setattr(
        "app.agents.tutor_agent.nodes.router._peek_active_study_card",
        _fake_active_card,
    )

    result = await router_node(
        {
            "user_input": "cat",
            "user_id": "cli-user",
            "session_id": "session-1",
            "persist_artifacts": False,
            "messages": [],
            "iterations": 0,
        }
    )

    assert result["route"] == "fsrs"
    assert "active study card" in result["thought"].lower()
