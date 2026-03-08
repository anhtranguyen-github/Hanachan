"""Output guard – safety check on generated response."""

from __future__ import annotations

import logging
import re
from typing import Any

from app.agents.advanced_tutor_agent.state import TutorState

logger = logging.getLogger(__name__)

_PII_PATTERNS = [
    re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"),
    re.compile(r"\b\d{3}[-.]?\d{3,4}[-.]?\d{4}\b"),
    re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
]


def output_guard_node(state: TutorState) -> dict[str, Any]:
    """Check the generated response for PII leaks or safety issues."""
    generation = state.get("generation", "")
    if not generation:
        return {}

    for pattern in _PII_PATTERNS:
        if pattern.search(generation):
            logger.warning("output_guard: PII detected in generation, redacting")
            generation = pattern.sub("[REDACTED]", generation)

    if generation != state.get("generation", ""):
        return {"generation": generation, "thought": "Output guard redacted PII."}

    return {"thought": "Output passed guard."}
