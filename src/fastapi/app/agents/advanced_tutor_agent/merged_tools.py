import logging
from typing import Any
from uuid import UUID

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from app.core.supabase import get_supabase_client
from app.domain.chat.deck_service import DeckService
from app.domain.learning.models import Rating
from app.domain.learning.services import LearningService
from app.repositories.learning import SupabaseLearningRepository
from app.services.memory import episodic_memory as ep_mem
from app.services.memory import semantic_memory as sem_mem
from app.utils.safe_sql import (
    DEFAULT_TABLE_WHITELIST,
    SafeSqlError,
    USER_ID_SQL_PLACEHOLDER,
    assess_sql_risk,
    render_sql_for_user,
    validate_sql_query,
)

logger = logging.getLogger(__name__)
_db_pool: Any | None = None


def _learning_service() -> LearningService:
    return LearningService(SupabaseLearningRepository(get_supabase_client()))


def _deck_service() -> DeckService:
    return DeckService(get_supabase_client())


def _get_database_schema_impl() -> str:
    client = get_supabase_client()
    response = client.rpc("get_database_schema").execute()

    data = response.data
    if not data:
        return "{}"

    schema: dict[str, list[dict[str, str]]] = {}
    for row in data:
        table_name = row["table_name"]
        if table_name not in DEFAULT_TABLE_WHITELIST:
            continue
        schema.setdefault(table_name, []).append(
            {
                "column": row["column_name"],
                "type": row["data_type"],
                "key": row["key_type"],
            }
        )
    return str(schema)


def _execute_read_only_sql_impl(sql: str, *, user_id: str | None) -> str:
    risk = assess_sql_risk(sql)
    validated_sql = validate_sql_query(sql, table_whitelist=DEFAULT_TABLE_WHITELIST)
    bounded_sql = _apply_sql_limit(validated_sql)
    rendered_sql = render_sql_for_user(bounded_sql, user_id)
    logger.info(
        "sql_audit_execute_read_only_sql",
        extra={
            "user_id": user_id,
            "tables": risk["tables"],
            "risk_flags": risk["risk_flags"],
            "requires_review": risk["requires_review"],
        },
    )
    client = get_supabase_client()
    response = client.rpc(
        "execute_read_only_sql",
        {
            "sql_query": rendered_sql,
            "allowed_tables": sorted(DEFAULT_TABLE_WHITELIST),
        },
    ).execute()

    return str(response.data or [])


def _apply_sql_limit(sql: str, default_limit: int = 100) -> str:
    if "LIMIT" not in sql.upper():
        return f"{sql.rstrip(';')} LIMIT {default_limit}"
    return sql


class EpisodicMemorySchema(BaseModel):
    query: str = Field(description="The search query for past conversations.")


class SemanticFactsSchema(BaseModel):
    keywords: list[str] = Field(description="List of keywords to search for in structured facts.")


class LearningProgressSchema(BaseModel):
    identifier: str = Field(description="Kanji, Slug, or Word to look up.")
    include_notes: bool = Field(default=False, description="Whether to include personal notes.")


class KnowledgeSearchSchema(BaseModel):
    query: str = Field(description="Search term for the knowledge base.")


class AppendNoteSchema(BaseModel):
    identifier: str = Field(description="Character or word to save the note to.")
    note_content: str = Field(description="The mnemonic or trick to remember.")


class LimitSchema(BaseModel):
    limit: int = Field(default=5, description="Number of results to return.")


class EmptySchema(BaseModel):
    pass


class SQLSchema(BaseModel):
    sql: str = Field(description="The SELECT query to execute.")


class DueItemsLimitSchema(BaseModel):
    limit: int = Field(default=20, description="Max number of items to fetch.")


class ReviewSchema(BaseModel):
    item_id: str = Field(description="The UUID of the knowledge unit being reviewed.")
    rating: str = Field(description="The review result: 'again', 'hard', 'good', 'pass', or 'easy'.")
    facet: str = Field(default="meaning", description="Which part was reviewed.")


class CreateDeckSchema(BaseModel):
    name: str = Field(description="The name of the new deck.")
    description: str | None = Field(default=None, description="Optional description of the deck.")


class ListDecksSchema(BaseModel):
    pass


class AddToDeckSchema(BaseModel):
    deck_name_or_id: str = Field(description="Name or ID of the deck.")
    item_identifier: str = Field(description="The item (Kanji/Slug/Word) to add.")
    item_type: str = Field(description="Type of item ('kanji', 'vocabulary', etc.)")


class RemoveFromDeckSchema(BaseModel):
    deck_name_or_id: str = Field(description="Name or ID of the deck.")
    item_identifier: str = Field(description="The item (Kanji/Slug/Word) to remove.")
    item_type: str = Field(description="Type of item.")


class ViewDeckSchema(BaseModel):
    deck_name_or_id: str = Field(description="Name or ID of the deck to view.")


@tool(args_schema=EpisodicMemorySchema)
def get_episodic_memory(query: str, **kwargs) -> str:
    """Search past conversation summaries for relevant user context."""
    user_id = kwargs.get("user_id", "INJECTED")
    results = ep_mem.search_episodic_memory(user_id, query, k=3)
    if not results:
        return "No relevant past conversations found."
    return "\n".join([f"- {r.text} (Context score: {r.score})" for r in results])


@tool(args_schema=SemanticFactsSchema)
def get_semantic_facts(keywords: list[str], **kwargs) -> str:
    """Search structured semantic memory facts for the current user."""
    user_id = kwargs.get("user_id", "INJECTED")
    results = sem_mem.search_semantic_memory(user_id, keywords)
    if not results:
        return "No specific facts found for these keywords."
    return "\n".join(
        [
            f"- ({r['source'].get('id')}) —[{r['relationship']}]→ ({r['target'].get('id')})"
            for r in results[:15]
        ]
    )


@tool(args_schema=LearningProgressSchema)
async def get_user_learning_progress(identifier: str, include_notes: bool = False, **kwargs) -> str:
    """Retrieve learning progress for a specific knowledge unit."""
    user_id = kwargs.get("user_id", "INJECTED")
    try:
        status_data = await _learning_service().get_ku_progress(user_id, identifier)
        if not status_data:
            return f"No learning record found for '{identifier}'."
        return str(status_data.model_dump())
    except Exception as e:
        logger.error(f"Error getting learning progress: {e}")
        return f"Failed to retrieve learning progress: {e!s}"


@tool(args_schema=KnowledgeSearchSchema)
async def search_knowledge_units(query: str, **kwargs) -> str:
    """Search the knowledge unit catalog by character, meaning, or slug."""
    try:
        results = await _learning_service().search_knowledge(query, 5)
        if not results:
            return f"No knowledge units found for '{query}'."
        return str([result.model_dump() for result in results])
    except Exception as e:
        logger.error(f"Error searching knowledge: {e}")
        return f"Failed to search knowledge: {e!s}"


@tool(args_schema=AppendNoteSchema)
async def append_to_learning_notes(identifier: str, note_content: str, **kwargs) -> str:
    """Append a personal learning note to a matched knowledge unit."""
    user_id = kwargs.get("user_id", "INJECTED")
    try:
        results = await _learning_service().search_knowledge(identifier, 1)
        if not results:
            return f"Could not find any knowledge unit matching '{identifier}' to save the note to."
        ku = results[0]
        await _learning_service().add_note(user_id, ku.id, note_content)
        return f"Added note to '{ku.slug or ku.id}'."
    except Exception as e:
        logger.error(f"Error appending note: {e}")
        return f"Failed to append note: {e!s}"


@tool(args_schema=LimitSchema)
async def get_recent_reviews(limit: int = 5, **kwargs) -> str:
    """Return the user's most recent review log entries."""
    user_id = kwargs.get("user_id", "INJECTED")
    try:
        results = await _learning_service().get_recent_reviews(user_id, limit)
        if not results:
            return "No recent reviews found."
        return str(results)
    except Exception as e:
        logger.error(f"Error getting recent reviews: {e}")
        return f"Failed to retrieve recent reviews: {e!s}"


@tool(args_schema=EmptySchema)
async def get_database_schema(**kwargs) -> str:
    """Return the approved database schema for safe SQL generation."""
    try:
        return _get_database_schema_impl()
    except Exception as e:
        logger.error(f"Error getting schema: {e}")
        return f"Failed to retrieve schema: {e!s}"


@tool(args_schema=SQLSchema)
async def execute_read_only_sql(sql: str, **kwargs) -> str:
    """Execute a read-only SQL query against the application database."""
    try:
        return _execute_read_only_sql_impl(sql, user_id=kwargs.get("user_id"))
    except SafeSqlError as e:
        logger.warning("Rejected unsafe SQL query: %s", e)
        return (
            "Error: unsafe SQL rejected. Use only approved learner tables, avoid SELECT *, "
            f"and scope user data with user_id = {USER_ID_SQL_PLACEHOLDER}."
        )
    except Exception as e:
        logger.error(f"Error executing SQL: {e}")
        return f"Failed to execute SQL: {e!s}"


@tool(args_schema=DueItemsLimitSchema)
async def get_due_items(limit: int = 20, **kwargs) -> str:
    """Fetch knowledge units that are due for review."""
    user_id = kwargs.get("user_id", "INJECTED")
    try:
        results = await _learning_service().get_due_items(user_id, limit)
        if not results:
            return "No items are currently due for review."
        return str([result.model_dump() for result in results])
    except Exception as e:
        logger.error(f"Error getting due items: {e}")
        return f"Failed to retrieve due items: {e!s}"


@tool(args_schema=ReviewSchema)
async def submit_review(item_id: str, rating: str, facet: str = "meaning", **kwargs) -> str:
    """Record a review result for a knowledge unit."""
    user_id = kwargs.get("user_id", "INJECTED")
    try:
        valid_ratings = ["again", "hard", "good", "pass", "easy"]
        if rating.lower() not in valid_ratings:
            return f"Error: rating must be one of {valid_ratings}."
        result = await _learning_service().submit_review(
            user_id=user_id,
            ku_id=item_id,
            facet=facet,
            rating=Rating(rating.lower()),
            wrong_count=0,
        )
        return f"Review recorded: {result.model_dump()}"
    except Exception as e:
        logger.error(f"Error submitting review: {e}")
        return f"Failed to submit review: {e!s}"


@tool(args_schema=CreateDeckSchema)
async def create_user_deck(name: str, description: str | None = None, **kwargs) -> str:
    """Create a custom user deck."""
    user_id = kwargs.get("user_id", "INJECTED")
    try:
        result = await _deck_service().create_deck(user_id, name, description)
        return f"Successfully created deck '{name}'\nResult: {result}"
    except Exception as e:
        logger.error(f"Error creating deck: {e}")
        return f"Failed to create deck: {e!s}"


@tool(args_schema=ListDecksSchema)
async def list_my_decks(**kwargs) -> str:
    """List all custom decks owned by the current user."""
    user_id = kwargs.get("user_id", "INJECTED")
    try:
        decks = await _deck_service().list_decks(user_id)
        if not decks:
            return "You don't have any custom decks yet. Would you like to create one?"
        return f"Your custom decks:\n{decks}"
    except Exception as e:
        logger.error(f"Error listing decks: {e}")
        return f"Failed to list decks: {e!s}"


async def _resolve_deck_id(user_id: str, deck_name_or_id: str) -> str:
    try:
        UUID(deck_name_or_id)
        return deck_name_or_id
    except ValueError:
        decks = await _deck_service().list_decks(user_id)
        deck = next((d for d in decks if d.get("name") == deck_name_or_id), None)
        if not deck:
            raise ValueError(f"Could not find a deck named '{deck_name_or_id}'.")
        return str(deck["id"])


@tool(args_schema=AddToDeckSchema)
async def add_to_deck(deck_name_or_id: str, item_identifier: str, item_type: str, **kwargs) -> str:
    """Add a knowledge unit to a user deck."""
    user_id = kwargs.get("user_id", "INJECTED")
    try:
        deck_id = await _resolve_deck_id(user_id, deck_name_or_id)
        await _deck_service().add_deck_item(user_id, deck_id, item_identifier, item_type)
        return f"Successfully added {item_type} '{item_identifier}' to deck."
    except Exception as e:
        logger.error(f"Error adding to deck: {e}")
        return f"Failed to add item to deck: {e!s}"


@tool(args_schema=RemoveFromDeckSchema)
async def remove_from_deck(deck_name_or_id: str, item_identifier: str, item_type: str, **kwargs) -> str:
    """Remove a knowledge unit from a user deck."""
    user_id = kwargs.get("user_id", "INJECTED")
    try:
        deck_id = await _resolve_deck_id(user_id, deck_name_or_id)
        await _deck_service().remove_deck_item(user_id, deck_id, item_identifier, item_type)
        return f"Successfully removed {item_type} '{item_identifier}' from deck."
    except Exception as e:
        logger.error(f"Error removing from deck: {e}")
        return f"Failed to remove item from deck: {e!s}"


@tool(args_schema=ViewDeckSchema)
async def view_deck_contents(deck_name_or_id: str, **kwargs) -> str:
    """Return all items currently stored in a user deck."""
    user_id = kwargs.get("user_id", "INJECTED")
    try:
        deck_id = await _resolve_deck_id(user_id, deck_name_or_id)
        result = await _deck_service().view_deck_contents(user_id, deck_id)
        return f"Contents of deck {deck_id}: {result}"
    except Exception as e:
        logger.error(f"Error viewing deck: {e}")
        return f"Failed to view deck: {e!s}"


DECK_TOOLS = [create_user_deck, list_my_decks, add_to_deck, remove_from_deck, view_deck_contents]

TOOLS = [
    get_episodic_memory,
    get_semantic_facts,
    get_user_learning_progress,
    get_recent_reviews,
    get_due_items,
    search_knowledge_units,
    append_to_learning_notes,
    get_database_schema,
    execute_read_only_sql,
    submit_review,
] + DECK_TOOLS
