"""
Observability — ExecutionTraceHandler callback for per-node timing and token tracking.

Usage:
    handler = ExecutionTraceHandler()
    graph.invoke(input, config={"callbacks": [handler]})
    print(handler.trace.summary())
"""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass, field

from langchain_core.callbacks import BaseCallbackHandler

logger = logging.getLogger("hanchan.trace")


@dataclass
class NodeTrace:
    """Trace for a single node execution."""

    node_name: str
    start_time: float = 0.0
    end_time: float = 0.0
    duration_ms: float = 0.0
    tokens_in: int = 0
    tokens_out: int = 0
    error: str | None = None


@dataclass
class ExecutionTrace:
    """Full trace for one graph invocation."""

    thread_id: str = ""
    user_id: str = ""
    start_time: float = 0.0
    total_duration_ms: float = 0.0
    nodes: list[NodeTrace] = field(default_factory=list)
    total_tokens_in: int = 0
    total_tokens_out: int = 0

    def summary(self) -> dict:
        return {
            "thread_id": self.thread_id,
            "user_id": self.user_id,
            "total_ms": round(self.total_duration_ms, 1),
            "node_count": len(self.nodes),
            "total_tokens": self.total_tokens_in + self.total_tokens_out,
            "nodes": [
                {"name": n.node_name, "ms": round(n.duration_ms, 1), "error": n.error}
                for n in self.nodes
            ],
        }


class ExecutionTraceHandler(BaseCallbackHandler):
    """LangChain callback handler for graph execution tracing."""

    def __init__(self) -> None:
        self._trace = ExecutionTrace()
        self._current_node: NodeTrace | None = None

    @property
    def trace(self) -> ExecutionTrace:
        return self._trace

    def on_chain_start(self, serialized, inputs, **kwargs):
        if not self._trace.start_time:
            self._trace.start_time = time.monotonic()
            self._trace.thread_id = (
                kwargs.get("config", {}).get("configurable", {}).get("thread_id", "")
            )

    def on_chain_end(self, outputs, **kwargs):
        if self._current_node:
            self._current_node.end_time = time.monotonic()
            self._current_node.duration_ms = (
                self._current_node.end_time - self._current_node.start_time
            ) * 1000
            self._trace.nodes.append(self._current_node)
            self._current_node = None

        self._trace.total_duration_ms = (time.monotonic() - self._trace.start_time) * 1000

    def on_llm_start(self, serialized, prompts, **kwargs):
        node_name = kwargs.get("tags", ["unknown"])[0] if kwargs.get("tags") else "llm"
        self._current_node = NodeTrace(node_name=node_name, start_time=time.monotonic())

    def on_llm_end(self, response, **kwargs):
        if self._current_node and response.llm_output:
            usage = response.llm_output.get("token_usage", {})
            self._current_node.tokens_in = usage.get("prompt_tokens", 0)
            self._current_node.tokens_out = usage.get("completion_tokens", 0)
            self._trace.total_tokens_in += self._current_node.tokens_in
            self._trace.total_tokens_out += self._current_node.tokens_out

    def on_chain_error(self, error, **kwargs):
        if self._current_node:
            self._current_node.error = str(error)
        logger.error(f"Chain error: {error}")
