"""Input guard – PII masking + content filter."""

from __future__ import annotations

import logging
import re
from typing import Any

from app.agents.tutor_agent.state import TutorState

logger = logging.getLogger(__name__)

# Simple regex blocklist for obvious PII patterns
_EMAIL_RE = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
_PHONE_RE = re.compile(r"\b\d{3}[-.]?\d{3,4}[-.]?\d{4}\b")
_SSN_RE = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")

_BLOCKED_PATTERNS = [
    re.compile(p, re.IGNORECASE)
    for p in [
        r"\b(hack|exploit|inject|drop\s+table)\b",
        r"\b(ignore\s+previous|ignore\s+all|disregard)\b",
    ]
]


def _mask_pii(text: str) -> str:
    text = _EMAIL_RE.sub("[EMAIL]", text)
    text = _PHONE_RE.sub("[PHONE]", text)
    text = _SSN_RE.sub("[SSN]", text)
    return text


def _is_blocked(text: str) -> bool:
    return any(p.search(text) for p in _BLOCKED_PATTERNS)


def input_guard_node(state: TutorState) -> dict[str, Any]:
    """Sanitise user input: mask PII, reject blocked content."""
    raw = state["user_input"]

    if _is_blocked(raw):
        logger.warning("input_guard blocked message")
        return {
            "route": "blocked",
            "generation": "I'm sorry, I can't process that request.",
            "thought": "Input blocked by content filter.",
        }

    cleaned = _mask_pii(raw)
    updates: dict[str, Any] = {"thought": "Input passed guard."}
    if cleaned != raw:
        updates["user_input"] = cleaned
        logger.info("input_guard masked PII in user input")
    return updates
