"""Compatibility wrapper for the removed MCP tutor agent."""

from __future__ import annotations

from typing import Any

from app.agents.tutor_agent import run_chat


class TutorAgent:
    async def respond(self, message: str, jwt: str, session_id: str | None = None) -> dict[str, Any]:
        result = await run_chat(
            user_id="00000000-0000-0000-0000-000000000000",
            jwt=jwt,
            message=message,
            session_id=session_id,
        )
        return {
            "reply": result["response"],
            "tools": {},
        }
