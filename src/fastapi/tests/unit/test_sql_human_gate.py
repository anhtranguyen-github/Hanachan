from __future__ import annotations

from langchain_core.messages import AIMessage

from app.agents.tutor_agent.nodes.human_gate import human_gate_node
from app.agents.tutor_agent.nodes.sql_node import _stage_sql_approval_if_needed


def test_sql_node_stages_high_risk_query_for_approval():
    response = AIMessage(
        content="",
        tool_calls=[
            {
                "id": "call-1",
                "name": "execute_read_only_sql",
                "args": {
                    "sql": (
                        "WITH recent AS (SELECT item_id, user_id FROM user_reviews "
                        "WHERE user_id = __USER_ID__) "
                        "SELECT recent.item_id, count(*) FROM recent "
                        "JOIN review_sessions ON review_sessions.user_id = __USER_ID__ "
                        "GROUP BY recent.item_id"
                    )
                },
            }
        ],
    )

    staged = _stage_sql_approval_if_needed(response, {"messages": []})

    assert staged is not None
    assert staged["needs_human_approval"] is True
    assert staged["pending_sql_action"]["tool_name"] == "execute_read_only_sql"
    assert staged["pending_sql_action"]["risk"]["requires_review"] is True


def test_human_gate_executes_pending_sql_after_approval(monkeypatch):
    monkeypatch.setattr(
        "app.agents.tutor_agent.nodes.human_gate.interrupt",
        lambda payload: True,
    )
    monkeypatch.setattr(
        "app.agents.tutor_agent.nodes.human_gate._execute_read_only_sql_impl",
        lambda sql, user_id: "[{'count': 3}]",
    )

    state = {
        "user_id": "00000000-0000-0000-0000-000000000123",
        "thought": "Awaiting approval",
        "pending_sql_action": {
            "tool_call_id": "call-1",
            "tool_name": "execute_read_only_sql",
            "sql": "SELECT count(*) FROM user_reviews WHERE user_id = __USER_ID__",
            "risk": {"requires_review": True, "tables": ["user_reviews"], "risk_flags": ["uses_aggregation"]},
        },
    }

    result = human_gate_node(state)

    assert result["human_approved"] is True
    assert result["needs_human_approval"] is False
    assert result["pending_sql_action"] is None
    assert result["messages"][0].content == "[{'count': 3}]"


def test_human_gate_denies_pending_sql(monkeypatch):
    monkeypatch.setattr(
        "app.agents.tutor_agent.nodes.human_gate.interrupt",
        lambda payload: False,
    )

    state = {
        "user_id": "00000000-0000-0000-0000-000000000123",
        "thought": "Awaiting approval",
        "pending_sql_action": {
            "tool_call_id": "call-1",
            "tool_name": "execute_read_only_sql",
            "sql": "SELECT count(*) FROM user_reviews WHERE user_id = __USER_ID__",
            "risk": {"requires_review": True, "tables": ["user_reviews"], "risk_flags": ["uses_aggregation"]},
        },
    }

    result = human_gate_node(state)

    assert result["human_approved"] is False
    assert result["needs_human_approval"] is False
    assert result["pending_sql_action"] is None
    assert "denied" in result["messages"][0].content.lower()
