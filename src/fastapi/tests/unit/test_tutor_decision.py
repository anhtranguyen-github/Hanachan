from __future__ import annotations

import time

from app.agents.tutor_agent.nodes.decision import decision_node, decision_router


def test_decision_direct_route_skips_loop():
    state = {
        "route": "direct",
        "iterations": 1,
        "start_time": time.time(),
        "messages": [],
        "needs_human_approval": False,
    }

    result = decision_node(state)

    assert "proceeding to generate" in result["thought"].lower()
    assert decision_router(state) == "ready"
