import time
import pytest
from app.agents.memory_agent.graph import router_orchestrator, MAX_ITERATIONS, GLOBAL_TIMEOUT
from app.agents.memory_agent.state import AgentState

def test_router_orchestrator_iteration_limit():
    state: AgentState = {
        "iterations": MAX_ITERATIONS,
        "active_workers": ["memory_worker"],
        "start_time": time.time(),
        "messages": [],
        "user_id": "test",
        "jwt": "test",
    }
    # Should ignore active_workers and return "reviewer"
    assert router_orchestrator(state) == "reviewer"

def test_router_orchestrator_timeout():
    state: AgentState = {
        "iterations": 0,
        "active_workers": ["memory_worker"],
        "start_time": time.time() - (GLOBAL_TIMEOUT + 1),
        "messages": [],
        "user_id": "test",
        "jwt": "test",
    }
    # Should ignore active_workers and return "reviewer"
    assert router_orchestrator(state) == "reviewer"

def test_router_orchestrator_normal_dispatch():
    state: AgentState = {
        "iterations": 0,
        "active_workers": ["memory_worker"],
        "start_time": time.time(),
        "messages": [],
        "user_id": "test",
        "jwt": "test",
    }
    assert router_orchestrator(state) == "memory_worker"
