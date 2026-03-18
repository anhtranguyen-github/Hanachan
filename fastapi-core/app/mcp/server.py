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
from app.mcp.tools.profile import get_my_profile
from app.mcp.tools.progress import get_learning_progress
from app.mcp.tools.homework import get_homework
from app.auth.context import get_current_user_id


class ToolCallRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    arguments: dict[str, Any] = Field(default_factory=dict)


class ToolCallResponse(BaseModel):
    tool_name: str
    result: Any


ToolFn = Callable[[Client, str, dict[str, Any]], Awaitable[Any]]

def _get_supabase() -> Client:
    from app.core.config import settings
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_KEY
    if not url or not key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase config missing (SUPABASE_URL and SUPABASE_SERVICE_KEY required)",
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


from mcp.server.fastmcp import FastMCP
from app.adapters.http.learning import get_learning_service
from app.adapters.http.reading import get_reading_service
from app.core.reading.models import AnswerSubmission
from app.core.services.deck_service import DeckService

mcp = FastMCP("hanachan-core-mcp")

# CORE TOOLS
@mcp.tool()
async def get_my_profile():
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
    sb = _get_supabase()
    return await get_my_profile(supabase=sb, user_id=user_id)


@mcp.tool()
async def get_homework():
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
    sb = _get_supabase()
    return await get_homework(supabase=sb, user_id=user_id)


# DECK TOOLS
@mcp.tool()
async def create_deck(name: str, description: str | None = None):
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
    return await DeckService.create_deck(user_id, name, description)


@mcp.tool()
async def list_decks():
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
    return await DeckService.list_decks(user_id)


@mcp.tool()
async def add_to_deck(deck_id: str, item_identifier: str, item_type: str = "ku"):
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
    return await DeckService.add_deck_item(user_id, deck_id, item_identifier, item_type)


@mcp.tool()
async def remove_from_deck(deck_id: str, item_identifier: str, item_type: str = "ku"):
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
    await DeckService.remove_deck_item(user_id, deck_id, item_identifier, item_type)
    return "successfully removed"


@mcp.tool()
async def view_deck_contents(deck_id: str):
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
    return await DeckService.view_deck_contents(user_id, deck_id)


@mcp.tool()
async def get_learning_progress(identifier: str):
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
    service = get_learning_service()
    data = await service.get_ku_progress(user_id, identifier)
    # convert Pydantic model to dict if needed for MCP JSON serialization
    return data.dict() if data else None


@mcp.tool()
async def search_knowledge(query: str):
    # Knowledge search is public-ish but we still want the user context for logging/future RLS
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
    service = get_learning_service()
    results = await service.search_knowledge(query, 5)
    return [r.dict() for r in results]


@mcp.tool()
async def get_recent_reviews(limit: int = 5):
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
    service = get_learning_service()
    return await service.get_recent_reviews(user_id, limit)


@mcp.tool()
async def get_due_items(limit: int = 20):
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
    service = get_learning_service()
    items = await service.get_due_items(user_id, limit)
    return [i.dict() for i in items]


@mcp.tool()
async def add_ku_note(ku_id: str, note_content: str):
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
    service = get_learning_service()
    await service.add_note(user_id, ku_id, note_content)
    return "note added"


@mcp.tool()
async def submit_review(ku_id: str, facet: str = "meaning", rating: str = "pass", wrong_count: int = 0):
    """Record a review result for a knowledge unit. Ratings: 'again', 'hard', 'good', 'easy'."""
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
    from app.models.learning import Rating as RatingEnum
    service = get_learning_service()
    result = await service.submit_review(
        user_id=user_id,
        ku_id=ku_id,
        facet=facet,
        rating=RatingEnum(rating),
        wrong_count=wrong_count,
    )
    return result.dict() if result else None


# READING TOOLS
@mcp.tool()
async def submit_reading_answer(
    exercise_id: str,
    question_index: int,
    user_answer: str,
    time_spent_seconds: int = 0,
):
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
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
async def upsert_chat_session(session_id: str):
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
    from app.adapters.http.chat import get_chat_service
    service = get_chat_service()
    return await service.upsert_chat_session(user_id, session_id)


@mcp.tool()
async def add_chat_message(session_id: str, role: str, content: str):
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
    from app.adapters.http.chat import get_chat_service
    service = get_chat_service()
    return await service.add_chat_message(user_id, session_id, role, content)


@mcp.tool()
async def get_chat_messages(session_id: str):
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
    from app.adapters.http.chat import get_chat_service
    service = get_chat_service()
    return await service.get_chat_messages(user_id, session_id)


@mcp.tool()
async def update_chat_session(
    session_id: str, title: str | None = None, summary: str | None = None
):
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")
    from app.adapters.http.chat import get_chat_service
    service = get_chat_service()
    return await service.update_chat_session(user_id, session_id, title, summary)


# NEW TEXT-TO-SQL TOOLS

@mcp.tool()
async def get_database_schema():
    """Retrieves the public schema structure (tables, columns, types)."""
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")

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
async def execute_read_only_sql(sql: str):
    """Executes a read-only SELECT query against the database."""
    user_id = get_current_user_id()
    if not user_id: raise HTTPException(401, "Unauthorized")

    if not _is_safe_sql(sql):
        return {"error": "SQL injection detected or forbidden mutating keyword used. Only SELECT/WITH allowed."}
    
    sql = _apply_sql_limit(sql)
    pool = await _get_db_pool()
    
    try:
        async with pool.acquire() as conn:
            async with conn.transaction():
                # Enforce RLS by setting the claims
                claims_json = f'{{"sub": "{user_id}"}}'
                await conn.execute(f"SELECT set_config('request.jwt.claims', '{claims_json}', true)")
                
                await conn.execute("SET TRANSACTION READ ONLY")
                rows = await conn.fetch(sql)
                return [dict(r) for r in rows]

    except Exception as e:
        return {"error": str(e)}
