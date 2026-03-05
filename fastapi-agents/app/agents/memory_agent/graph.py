from langgraph.graph import END, StateGraph
from app.agents.memory_agent.state import AgentState
from app.agents.memory_agent.nodes.implementation import (
    planner_node, tools_node, reviewer_node, 
    rewriter_node, generator_node, tts_node, 
    update_memory_node
)

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

def _build_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("planner", planner_node)
    workflow.add_node("tools", tools_node)
    workflow.add_node("reviewer", reviewer_node)
    workflow.add_node("rewrite", rewriter_node)
    workflow.add_node("generate", generator_node)
    workflow.add_node("tts", tts_node)
    workflow.add_node("update", update_memory_node)

    workflow.set_entry_point("planner")

    # Conditional edge after planner
    workflow.add_conditional_edges(
        "planner", should_continue, {"tools": "tools", "reviewer": "reviewer"}
    )

    # After tools always go back to planner to evaluate results
    workflow.add_edge("tools", "planner")

    # After reviewer decide rewrite or generate
    workflow.add_conditional_edges(
        "reviewer", decide_path, {"rewrite": "rewrite", "generate": "generate"}
    )

    # After rewrite go back to planner
    workflow.add_edge("rewrite", "planner")

    # Parallel path: Generation branches into TTS and Update simultaneously
    workflow.add_edge("generate", "tts")
    workflow.add_edge("generate", "update")
    
    # Both parallel branches go to END
    workflow.add_edge("tts", END)
    workflow.add_edge("update", END)

    return workflow.compile()

memory_graph = _build_graph()
