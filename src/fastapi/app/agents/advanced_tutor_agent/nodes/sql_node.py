"""SQL node – standalone text-to-SQL queries."""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import AIMessage, SystemMessage, ToolMessage

from app.agents.advanced_tutor_agent.state import TutorState
from app.agents.advanced_tutor_agent.merged_tools import execute_read_only_sql, get_database_schema
from app.core.llm import make_llm
from app.utils.safe_sql import USER_ID_SQL_PLACEHOLDER, assess_sql_risk

logger = logging.getLogger(__name__)

SQL_TOOLS = [get_database_schema, execute_read_only_sql]


def _stage_sql_approval_if_needed(response: AIMessage, state: TutorState) -> dict[str, Any] | None:
    for tool_call in response.tool_calls:
        if tool_call["name"] != "execute_read_only_sql":
            continue
        sql = str(tool_call["args"].get("sql", ""))
        risk = assess_sql_risk(sql)
        if not risk["requires_review"]:
            continue
        return {
            "messages": [
                response,
                ToolMessage(
                    tool_call_id=tool_call["id"],
                    content="SQL query staged for human approval before execution.",
                    name=tool_call["name"],
                ),
            ],
            "needs_human_approval": True,
            "pending_sql_action": {
                "tool_call_id": tool_call["id"],
                "tool_name": tool_call["name"],
                "sql": sql,
                "risk": risk,
            },
            "thought": "SQL node: staged high-risk SQL for human approval.",
        }
    return None


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
                "3. Query only the approved learner tables returned by the schema tool.\n"
                f"4. For any table that contains user data, you MUST filter with user_id = {USER_ID_SQL_PLACEHOLDER}.\n"
                "5. Never use SELECT * and never access auth, pg_catalog, information_schema, or storage.\n\n"
                "### FEW-SHOT EXAMPLES:\n"
                "- Question: 'Show me my database tables.'\n"
                "  Action: call get_database_schema instead of querying system catalogs.\n"
                "- Question: 'Show me my top characters by mastery.'\n"
                f"  SQL: 'SELECT item_id, mastery_level FROM user_learning_progress WHERE user_id = {USER_ID_SQL_PLACEHOLDER} ORDER BY mastery_level DESC LIMIT 5'\n"
                "- Question: 'How many decks do I have?'\n"
                f"  SQL: 'SELECT count(*) FROM user_deck_settings WHERE user_id = {USER_ID_SQL_PLACEHOLDER}'\n"
                "- Question: 'Show me my latest reviews.'\n"
                f"  SQL: 'SELECT item_id, rating, created_at FROM user_reviews WHERE user_id = {USER_ID_SQL_PLACEHOLDER} ORDER BY created_at DESC LIMIT 10'\n\n"
                f"Use {USER_ID_SQL_PLACEHOLDER} exactly for authenticated user filtering."
            )
        ),
    ]
    prompt.extend(state["messages"])

    response = await llm.ainvoke(prompt)

    if hasattr(response, "tool_calls") and response.tool_calls:
        staged = _stage_sql_approval_if_needed(response, state)
        if staged:
            return staged
        from app.agents.advanced_tutor_agent.nodes._tool_executor import execute_tool_calls

        tool_results = await execute_tool_calls(response.tool_calls, SQL_TOOLS, state)
        return {
            "messages": [response] + tool_results,
            "thought": "SQL node: executed tool calls for database queries.",
        }

    return {
        "messages": [response],
        "thought": "SQL node: responded directly.",
    }
