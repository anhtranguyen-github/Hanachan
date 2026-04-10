"""Shared tool executor for worker nodes that use LLM tool-calling."""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from langchain_core.messages import ToolMessage
from langchain_core.tools import BaseTool

logger = logging.getLogger(__name__)


async def execute_tool_calls(
    tool_calls: list[dict[str, Any]],
    tools: list[BaseTool],
    state: dict[str, Any],
) -> list[ToolMessage]:
    """Execute tool calls from an LLM response, injecting user_id/jwt."""
    tool_map = {t.name: t for t in tools}
    results: list[ToolMessage] = []

    for tc in tool_calls:
        tool_name = tc["name"]
        args = dict(tc["args"])

        if tool_name not in tool_map:
            results.append(
                ToolMessage(tool_call_id=tc["id"], content=f"Unknown tool: {tool_name}", name=tool_name)
            )
            continue

        # Inject credentials
        args["user_id"] = state.get("user_id", "INJECTED")
        args["jwt"] = state.get("jwt", "SYSTEM_PROVIDED")
        args["session_id"] = state.get("session_id")
        args["persist_artifacts"] = state.get("persist_artifacts", True)

        target = tool_map[tool_name]
        try:
            func = getattr(target, "coroutine", None) or getattr(target, "func", None)
            if not func:
                raise ValueError(f"No executable function for tool {tool_name}")

            if asyncio.iscoroutinefunction(func):
                content = await func(**args)
            else:
                content = func(**args)

            results.append(ToolMessage(tool_call_id=tc["id"], content=str(content), name=tool_name))
        except Exception as e:
            logger.error(f"Error in tool {tool_name}: {e}")
            results.append(ToolMessage(tool_call_id=tc["id"], content=f"Error: {str(e)}", name=tool_name))

    return results
