"""Tutor agent graph – wires all nodes per the architecture diagram.

START → input_guard → router → {memory|fsrs|sql|direct→decision}
→ decision → {needs_more→router | needs_approval→human_gate | ready→output_guard}
→ human_gate → output_guard → response → post_update → END
"""

from __future__ import annotations

from langgraph.graph import END, StateGraph

from app.agents.tutor_agent.nodes import (
    decision_node,
    decision_router,
    fsrs_node,
    human_gate_node,
    input_guard_node,
    memory_node,
    output_guard_node,
    post_update_node,
    response_node,
    router_node,
    sql_node,
)
from app.agents.tutor_agent.state import TutorState


def _route_after_input_guard(state: TutorState) -> str:
    """Skip to response if input was blocked."""
    if state.get("route") == "blocked":
        return "output_guard"
    return "router"


def _route_after_router(state: TutorState) -> str:
    """Dispatch to the correct worker node."""
    route = state.get("route", "direct")
    if route in ("memory", "fsrs", "sql"):
        return route
    return "decision"


def build_graph() -> StateGraph:
    g = StateGraph(TutorState)

    # ── Add nodes ─────────────────────────────────────────
    g.add_node("input_guard", input_guard_node)
    g.add_node("router", router_node)
    g.add_node("memory", memory_node)
    g.add_node("fsrs", fsrs_node)
    g.add_node("sql", sql_node)
    g.add_node("decision", decision_node)
    g.add_node("human_gate", human_gate_node)
    g.add_node("output_guard", output_guard_node)
    g.add_node("response", response_node)
    g.add_node("post_update", post_update_node)

    # ── Entry ─────────────────────────────────────────────
    g.set_entry_point("input_guard")

    # ── Edges ─────────────────────────────────────────────

    # input_guard → router (or output_guard if blocked)
    g.add_conditional_edges(
        "input_guard",
        _route_after_input_guard,
        {"router": "router", "output_guard": "output_guard"},
    )

    # router → memory | fsrs | sql | decision (direct)
    g.add_conditional_edges(
        "router",
        _route_after_router,
        {"memory": "memory", "fsrs": "fsrs", "sql": "sql", "decision": "decision"},
    )

    # workers → decision
    g.add_edge("memory", "decision")
    g.add_edge("fsrs", "decision")
    g.add_edge("sql", "decision")

    # decision → needs_more(router) | needs_approval(human_gate) | ready(output_guard)
    g.add_conditional_edges(
        "decision",
        decision_router,
        {"needs_more": "router", "needs_approval": "human_gate", "ready": "output_guard"},
    )

    # human_gate → output_guard
    g.add_edge("human_gate", "output_guard")

    # output_guard → response
    g.add_edge("output_guard", "response")

    # response → post_update
    g.add_edge("response", "post_update")

    # post_update → END
    g.add_edge("post_update", END)

    return g.compile()


tutor_graph = build_graph()
