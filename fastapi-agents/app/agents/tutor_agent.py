from __future__ import annotations

from typing import Any

from app.mcp.client import McpClient


from app.core.config import settings

class TutorAgent:
    """
    Minimal tutor agent demonstrating MCP tool usage.

    In production you would integrate this into your LangGraph/LLM loop and tool calling,
    but the core constraint stays the same: tools are called via MCP and are JWT-scoped.
    """

    def __init__(self, mcp: McpClient | None = None):
        self.mcp = mcp or McpClient(settings.fastapi_core_mcp_url)

    async def respond(self, *, message: str, jwt: str) -> dict[str, Any]:
        # Example: agent decides to call tools based on message intent.
        # (Simple heuristic for demo purposes.)
        wants_progress = "progress" in message.lower()
        wants_profile = "profile" in message.lower() or "who am i" in message.lower()

        tool_results: dict[str, Any] = {}

        if wants_profile:
            tool_results["profile"] = await self.mcp.call_tool(
                tool_name="get_my_profile",
                arguments={},
                jwt=jwt,
            )

        if wants_progress:
            tool_results["learning_progress"] = await self.mcp.call_tool(
                tool_name="get_learning_progress",
                arguments={},
                jwt=jwt,
            )

        # Agent continues response generation (placeholder)
        reply = "Here’s what I found."
        if not tool_results:
            reply = "Ask me about your profile or progress, and I’ll fetch it securely."

        return {"reply": reply, "tools": tool_results}

