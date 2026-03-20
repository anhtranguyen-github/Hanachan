"""SQL node – standalone text-to-SQL queries."""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import AIMessage, SystemMessage

from app.agents.tutor_agent.state import TutorState
from app.agents.tutor_agent.merged_tools import execute_read_only_sql, get_database_schema
from app.core.llm import make_llm

logger = logging.getLogger(__name__)

SQL_TOOLS = [get_database_schema, execute_read_only_sql]


async def sql_node(state: TutorState) -> dict[str, Any]:
    """Query Supabase via LLM tool-calling (single round)."""
    llm = make_llm().bind_tools(SQL_TOOLS)

    prompt = [
        SystemMessage(
            content=(
                "You are a SQL Expert for Hanachan.\n"
                "Your goal is to query the Supabase database for structured information.\n"
                "1. ALWAYS call 'get_database_schema' first if you don't know the table structure.\n"
                "2. Then use 'execute_read_only_sql' to fetch the data.\n"
                "Access control is handled at the system level.\n\n"
                "### FEW-SHOT EXAMPLES:\n"
                "- Question: 'Show me my database tables.'\n"
                "  SQL: 'SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';'\n"
                "- Question: 'Show me my top characters by mastery.'\n"
                "  SQL: 'SELECT item_id, mastery_level FROM user_learning_progress WHERE user_id = $1 ORDER BY mastery_level DESC LIMIT 5;'\n"
                "- Question: 'How many decks do I have?'\n"
                "  SQL: 'SELECT count(*) FROM user_deck_settings WHERE user_id = $1;'\n"
                "- Question: 'Show me my latest reviews.'\n"
                "  SQL: 'SELECT item_id, rating, created_at FROM user_reviews WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10;'\n\n"
                "Note: Use placeholders for values if your tool supports it, otherwise use direct values carefully."
            )
        ),
    ]
    prompt.extend(state["messages"])

    response = await llm.ainvoke(prompt)

    if hasattr(response, "tool_calls") and response.tool_calls:
        from app.agents.tutor_agent.nodes._tool_executor import execute_tool_calls

        tool_results = await execute_tool_calls(response.tool_calls, SQL_TOOLS, state)
        return {
            "messages": [response] + tool_results,
            "thought": "SQL node: executed tool calls for database queries.",
        }

    return {
        "messages": [response],
        "thought": "SQL node: responded directly.",
    }
