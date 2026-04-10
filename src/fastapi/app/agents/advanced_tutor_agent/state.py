from __future__ import annotations

from typing import Annotated, Any

from langchain_core.messages import BaseMessage
from typing_extensions import TypedDict


def _merge_lists(a: list, b: list) -> list:
    return a + b


class TutorState(TypedDict):
    """Graph state for the tutor agent."""

    # ── Identity ──────────────────────────────────────────
    user_id: str
    session_id: str | None
    jwt: str

    # ── Input ─────────────────────────────────────────────
    user_input: str
    messages: Annotated[list[BaseMessage], _merge_lists]

    # ── Routing ───────────────────────────────────────────
    route: str | None  # "memory" | "fsrs" | "sql" | "direct" | "blocked"
    thought: str
    iterations: int

    # ── HITL ──────────────────────────────────────────────
    needs_human_approval: bool
    human_approved: bool
    pending_sql_action: dict[str, Any] | None

    # ── Context ───────────────────────────────────────────
    thread_context: str

    # ── Output ────────────────────────────────────────────
    generation: str

    # ── Timing ────────────────────────────────────────────
    start_time: float

    # ── Internal ──────────────────────────────────────────
    _registry: Any
