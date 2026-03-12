import logging
import os
import re
from collections.abc import Awaitable, Callable
from typing import Any

import asyncpg
from fastapi import APIRouter, HTTPException, Request, status
from pydantic import BaseModel, ConfigDict, Field
from supabase import Client, create_client

from app.auth.middleware import get_user_id_from_request
from app.mcp.tools.homework import get_homework
from app.mcp.tools.profile import get_my_profile
from app.mcp.tools.progress import get_learning_progress


class ToolCallRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    arguments: dict[str, Any] = Field(default_factory=dict)


class ToolCallResponse(BaseModel):
    tool_name: str
    result: Any


ToolFn = Callable[[Client, str, dict[str, Any]], Awaitable[Any]]

def _get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY", "")
    if not url or not key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase config missing (SUPABASE_URL and SUPABASE_SERVICE_KEY/SUPABASE_KEY required)",
        )
    return create_client(url, key)

_db_pool: asyncpg.Pool | None = None


async def _get_db_pool() -> asyncpg.Pool:
    global _db_pool
    if _db_pool is None:
        dsn = os.getenv("DATABASE_URL")
        if not dsn:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="DATABASE_URL missing in environment",
            )
        # Handle Supabase pooler specific params (PgBouncer requires statement_cache_size=0)
        _db_pool = await asyncpg.create_pool(
            dsn, 
            min_size=1, 
            max_size=10,
            statement_cache_size=0
        )
    return _db_pool


def _is_safe_sql(sql: str) -> bool:
    """Strictly rejects non-SELECT or mutating keywords."""
    forbidden = [
        r"\bINSERT\b", r"\bUPDATE\b", r"\bDELETE\b", r"\bDROP\b", 
        r"\bALTER\b", r"\bTRUNCATE\b", r"\bCREATE\b", r"\bGRANT\b", 
        r"\bREVOKE\b", r"\bREPLACE\b"
    ]
    sql_upper = sql.upper()
    for pattern in forbidden:
        if re.search(pattern, sql_upper):
            return False
    # Also ensure it starts with SELECT or WITH (for CTEs)
    if not (sql_upper.strip().startswith("SELECT") or sql_upper.strip().startswith("WITH")):
        return False
    return True


def _apply_sql_limit(sql: str, default_limit: int = 100) -> str:
    """Appends LIMIT if not present."""
    if "LIMIT" not in sql.upper():
        return f"{sql.rstrip(';')} LIMIT {default_limit}"
    return sql


async def _tool_get_my_profile(sb: Client, user_id: str, _args: dict[str, Any]) -> Any:
    return await get_my_profile(supabase=sb, user_id=user_id)


async def _tool_get_learning_progress(sb: Client, user_id: str, _args: dict[str, Any]) -> Any:
    return await get_learning_progress(supabase=sb, user_id=user_id)


async def _tool_get_homework(sb: Client, user_id: str, _args: dict[str, Any]) -> Any:
    return await get_homework(supabase=sb, user_id=user_id)


TOOLS: dict[str, ToolFn] = {
    # Security constraint: these tools do NOT accept user_id in arguments.
    "get_my_profile": _tool_get_my_profile,
    "get_learning_progress": _tool_get_learning_progress,
    "get_homework": _tool_get_homework,
}


router = APIRouter(prefix="/mcp", tags=["MCP"])


@router.get("/tools")
async def list_tools() -> dict[str, Any]:
    return {"tools": sorted(TOOLS.keys())}


@router.post("/tools/{tool_name}", response_model=ToolCallResponse)
async def call_tool(tool_name: str, body: ToolCallRequest, request: Request) -> ToolCallResponse:
    """
    MCP tool call endpoint.

    - Verifies the caller is authenticated (user_id comes from verified JWT).
    - Does NOT accept `user_id` as an argument.
    - Ensures tools can only act on the authenticated user.
    """
    tool = TOOLS.get(tool_name)
    if not tool:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unknown tool")

    # Security: enforce that user identity comes ONLY from JWT.
    if "user_id" in body.arguments or "userId" in body.arguments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="user_id must not be provided as a tool argument",
        )

    user_id = get_user_id_from_request(request)
    sb = _get_supabase()
    result = await tool(sb, user_id, body.arguments)
    return ToolCallResponse(tool_name=tool_name, result=result)

from mcp.server.fastmcp import FastMCP

from app.adapters.http.learning import get_learning_service
from app.adapters.http.reading import get_reading_service
from app.core.reading.models import AnswerSubmission
from app.core.services.deck_service import DeckService

mcp = FastMCP("hanachan-core-mcp")


# DECK TOOLS
@mcp.tool()
async def create_deck(user_id: str, name: str, description: str | None = None):
    return await DeckService.create_deck(user_id, name, description)


@mcp.tool()
async def list_decks(user_id: str):
    return await DeckService.list_decks(user_id)


@mcp.tool()
async def add_to_deck(user_id: str, deck_id: str, item_identifier: str, item_type: str = "ku"):
    return await DeckService.add_deck_item(user_id, deck_id, item_identifier, item_type)


@mcp.tool()
async def remove_from_deck(user_id: str, deck_id: str, item_identifier: str, item_type: str = "ku"):
    await DeckService.remove_deck_item(user_id, deck_id, item_identifier, item_type)
    return "successfully removed"


@mcp.tool()
async def view_deck_contents(user_id: str, deck_id: str):
    return await DeckService.view_deck_contents(user_id, deck_id)


@mcp.tool()
async def get_learning_progress(user_id: str, identifier: str):
    service = get_learning_service()
    data = await service.get_ku_progress(user_id, identifier)
    # convert Pydantic model to dict if needed for MCP JSON serialization
    return data.dict() if data else None


@mcp.tool()
async def search_knowledge(user_id: str, query: str):
    service = get_learning_service()
    results = await service.search_knowledge(query, 5)
    return [r.dict() for r in results]


@mcp.tool()
async def get_recent_reviews(user_id: str, limit: int = 5):
    # Dummy implementation parity with REST route
    return []


@mcp.tool()
async def add_ku_note(user_id: str, ku_id: str, note_content: str):
    service = get_learning_service()
    await service.add_note(user_id, ku_id, note_content)
    return "note added"


# READING TOOLS
@mcp.tool()
async def submit_reading_answer(
    user_id: str,
    exercise_id: str,
    question_index: int,
    user_answer: str,
    time_spent_seconds: int = 0,
):
    service = get_reading_service()
    submission = AnswerSubmission(
        exercise_id=exercise_id,
        question_index=question_index,
        user_answer=user_answer,
        time_spent_seconds=time_spent_seconds,
    )
    result = await service.submit_answer(user_id, submission)
    return result.dict() if result else None


# CHAT TOOLS
@mcp.tool()
async def upsert_chat_session(user_id: str, session_id: str):
    from app.adapters.http.chat import get_chat_service

    service = get_chat_service()
    return await service.upsert_chat_session(user_id, session_id)


@mcp.tool()
async def add_chat_message(user_id: str, session_id: str, role: str, content: str):
    from app.adapters.http.chat import get_chat_service

    service = get_chat_service()
    return await service.add_chat_message(user_id, session_id, role, content)


@mcp.tool()
async def get_chat_messages(user_id: str, session_id: str):
    from app.adapters.http.chat import get_chat_service

    service = get_chat_service()
    return await service.get_chat_messages(user_id, session_id)


@mcp.tool()
async def update_chat_session(
    user_id: str, session_id: str, title: str | None = None, summary: str | None = None
):
    from app.adapters.http.chat import get_chat_service

    service = get_chat_service()
    return await service.update_chat_session(user_id, session_id, title, summary)


# NEW TEXT-TO-SQL TOOLS

@mcp.tool()
async def get_database_schema(user_id: str):
    """Retrieves the public schema structure (tables, columns, types)."""
    pool = await _get_db_pool()
    query = """
    SELECT 
        t.table_name, 
        c.column_name, 
        c.data_type,
        CASE WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY' ELSE '' END as key_type
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    LEFT JOIN (
        SELECT ku.table_name, column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
    ) pk ON t.table_name = pk.table_name AND c.column_name = pk.column_name
    WHERE t.table_schema = 'public'
    ORDER BY t.table_name, c.ordinal_position;
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(query)
        schema = {}
        for r in rows:
            t = r['table_name']
            if t not in schema:
                schema[t] = []
            schema[t].append({
                "column": r['column_name'],
                "type": r['data_type'],
                "key": r['key_type']
            })
        return schema


@mcp.tool()
async def execute_read_only_sql(user_id: str, sql: str):
    """Executes a read-only SELECT query against the database."""
    if not _is_safe_sql(sql):
        return {"error": "SQL injection detected or forbidden mutating keyword used. Only SELECT/WITH allowed."}
    
    sql = _apply_sql_limit(sql)
    pool = await _get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            # We use a transaction to be extra safe, although the user should also 
            # set up a readonly role at the DB level.
            async with conn.transaction():
                # Potential extra safety: SET TRANSACTION READ ONLY;
                await conn.execute("SET TRANSACTION READ ONLY")
                rows = await conn.fetch(sql)
                return [dict(r) for r in rows]
    except Exception as e:
        return {"error": str(e)}
