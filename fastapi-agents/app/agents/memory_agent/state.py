from __future__ import annotations

from typing import Annotated

from langchain_core.messages import BaseMessage
from typing_extensions import TypedDict


class AgentState(TypedDict):
    user_id: str
    session_id: str | None
    user_input: str
    # Iterative fields
    messages: Annotated[list[BaseMessage], lambda x, y: x + y]
    plan: str
    thought: str  # Added for process tracing
    iterations: int
    review_result: str  # "generate" or "rewrite"
    rewritten_query: str | None
    # Final output
    generation: str
    audio_file: str | None
    tts_enabled: bool
    jwt: str
    # For return compatibility
    thread_context: str
    retrieved_episodic: str
    retrieved_semantic: str
    retrieved_sql: str
    active_workers: list[str]
    current_worker: str | None
