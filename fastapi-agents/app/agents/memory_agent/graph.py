from langgraph.graph import END, StateGraph

from app.agents.memory_agent.nodes.implementation import (
    generator_node,
    orchestrator_node,
    reviewer_node,
    rewriter_node,
    tools_node,
    tts_node,
    update_memory_node,
)
from app.agents.memory_agent.nodes.workers import (
    fsrs_worker_node,
    memory_worker_node,
    sql_worker_node,
)
import time

MAX_ITERATIONS = 5
GLOBAL_TIMEOUT = 50.0  # seconds
from app.agents.memory_agent.state import AgentState


def should_continue(state: AgentState):
    """Router for the planner -> tool node path."""
    last_msg = state["messages"][-1]
    if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
        return "tools"
    return "reviewer"


def decide_path(state: AgentState):
    """Router for the reviewer output."""
    if state.get("review_result") == "rewrite":
        return "rewrite"
    return "generate"


def router_orchestrator(state: AgentState):
    """Decides which worker to trigger next with safety guardrails."""
    # 1. Guardrail: Iteration Limit
    if state.get("iterations", 0) >= MAX_ITERATIONS:
        return "reviewer"
    
    # 2. Guardrail: Global Timeout
    elapsed = time.time() - state.get("start_time", 0)
    if elapsed > GLOBAL_TIMEOUT:
        return "reviewer"

    active = state.get("active_workers", [])
    if not active:
        return "reviewer"
    
    next_worker = active[0]
    return next_worker


def router_worker(state: AgentState):
    """Check if worker needs tools or is done."""
    last_msg = state["messages"][-1]
    if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
        return "tools"
    
    # Done for this worker, pop it and go back to orchestrator for more or next
    return "orchestrator_pop"


def orchestrator_pop_node(state: AgentState):
    """Helper node to pop the current worker after it's done."""
    active = state.get("active_workers", [])
    if active:
        new_active = active[1:]
        return {"active_workers": new_active, "current_worker": new_active[0] if new_active else None}
    return {}


def _build_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("orchestrator", orchestrator_node)
    workflow.add_node("memory_worker", memory_worker_node)
    workflow.add_node("fsrs_worker", fsrs_worker_node)
    workflow.add_node("sql_worker", sql_worker_node)
    workflow.add_node("tools", tools_node)
    workflow.add_node("orchestrator_pop", orchestrator_pop_node)
    
    workflow.add_node("reviewer", reviewer_node)
    workflow.add_node("rewrite", rewriter_node)
    workflow.add_node("generate", generator_node)
    workflow.add_node("tts", tts_node)
    workflow.add_node("update", update_memory_node)

    workflow.set_entry_point("orchestrator")

    # Orchestrator Routes
    workflow.add_conditional_edges(
        "orchestrator", 
        router_orchestrator, 
        {
            "memory_worker": "memory_worker", 
            "fsrs_worker": "fsrs_worker",
            "sql_worker": "sql_worker", 
            "reviewer": "reviewer"
        }
    )

    # Workers conditionally route to tools or back to pop
    workflow.add_conditional_edges(
        "memory_worker", router_worker, {"tools": "tools", "orchestrator_pop": "orchestrator_pop"}
    )
    workflow.add_conditional_edges(
        "fsrs_worker", router_worker, {"tools": "tools", "orchestrator_pop": "orchestrator_pop"}
    )
    workflow.add_conditional_edges(
        "sql_worker", router_worker, {"tools": "tools", "orchestrator_pop": "orchestrator_pop"}
    )

    # Tools always go back to the current worker that was active
    def route_after_tools(state: AgentState):
        return state.get("current_worker", "orchestrator")  # Fallback
        
    workflow.add_conditional_edges(
        "tools", route_after_tools, {
            "memory_worker": "memory_worker", 
            "fsrs_worker": "fsrs_worker",
            "sql_worker": "sql_worker", 
            "orchestrator": "orchestrator"
        }
    )

    # After a worker is popped, go back to orchestrator check if more workers are left
    workflow.add_edge("orchestrator_pop", "orchestrator")

    # Reviewer logic remains same
    workflow.add_conditional_edges(
        "reviewer", decide_path, {"rewrite": "rewrite", "generate": "generate"}
    )
    workflow.add_edge("rewrite", "orchestrator")

    workflow.add_edge("generate", "tts")
    workflow.add_edge("generate", "update")
    workflow.add_edge("tts", END)
    workflow.add_edge("update", END)

    return workflow.compile()


memory_graph = _build_graph()
