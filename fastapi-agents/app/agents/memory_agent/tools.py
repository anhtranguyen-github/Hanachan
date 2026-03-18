import logging

from langchain_core.tools import tool

from app.agents.deck_manager import DECK_TOOLS
from app.core.config import settings
from app.mcp.client import McpClient
from app.services.memory import episodic_memory as ep_mem
from app.services.memory import semantic_memory as sem_mem

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class EpisodicMemorySchema(BaseModel):
    query: str = Field(description="The search query for past conversations.")


@tool(args_schema=EpisodicMemorySchema)
def get_episodic_memory(query: str, **kwargs) -> str:
    """Search past conversation summaries for context about a user's history or preferences.
    Use this if you need to remember what we talked about in previous sessions.
    """
    user_id = kwargs.get("user_id", "INJECTED")
    results = ep_mem.search_episodic_memory(user_id, query, k=3)
    if not results:
        return "No relevant past conversations found."
    return "\n".join([f"- {r.text} (Context score: {r.score})" for r in results])


class SemanticFactsSchema(BaseModel):
    keywords: list[str] = Field(description="List of keywords to search for in structured facts.")


@tool(args_schema=SemanticFactsSchema)
def get_semantic_facts(keywords: list[str], **kwargs) -> str:
    """Search structured facts about the user (interests, goals, preferred settings).
    Use this for specific factual questions about the person.
    """
    user_id = kwargs.get("user_id", "INJECTED")
    results = sem_mem.search_semantic_memory(user_id, keywords)
    logger.info(f"get_semantic_facts tool: found {len(results)} items for user {user_id}")
    if not results:
        return "No specific facts found for these keywords."
    res_text = "\n".join(
        [
            f"- ({r['source'].get('id')}) —[{r['relationship']}]→ ({r['target'].get('id')})"
            for r in results[:15]
        ]
    )
    return res_text


class LearningProgressSchema(BaseModel):
    identifier: str = Field(description="Kanji, Slug, or Word to look up.")
    include_notes: bool = Field(default=False, description="Whether to include personal notes.")


@tool(args_schema=LearningProgressSchema)
async def get_user_learning_progress(identifier: str, include_notes: bool = False, **kwargs) -> str:
    """Retrieve live learning stats for a specific Japanese character or slug.
    Identifiers can be Kanji (e.g. '桜'), Slugs (e.g. 'sakura'), or Words.
    If include_notes is True, it will also return the user's personal/agent notes for this item.
    """
    user_id = kwargs.get("user_id", "INJECTED")
    jwt = kwargs.get("jwt", "SYSTEM_PROVIDED")
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        # Call via MCP Tool
        status_data = await client.call_tool(
            "get_learning_progress", {"identifier": identifier}, jwt=jwt
        )

        if not status_data:
            return f"No learning record found for '{identifier}'."

        return str(status_data)
    except Exception as e:
        logger.error(f"Error getting learning progress: {e}")
        return f"Failed to retrieve learning progress: {str(e)}"


class KnowledgeSearchSchema(BaseModel):
    query: str = Field(description="Search term for the knowledge base.")


@tool(args_schema=KnowledgeSearchSchema)
async def search_knowledge_units(query: str, **kwargs) -> str:
    """Search the general Japanese knowledge database for meanings, characters, or slugs.
    Use this if the user asks 'What does X mean?' or 'How do you write Y?'.
    """
    user_id = kwargs.get("user_id", "INJECTED")
    jwt = kwargs.get("jwt", "SYSTEM_PROVIDED")
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        results = await client.call_tool("search_knowledge", {"query": query}, jwt=jwt)

        if not results:
            return f"No knowledge units found for '{query}'."
        return str(results)
    except Exception as e:
        logger.error(f"Error searching knowledge: {e}")
        return f"Failed to search knowledge: {str(e)}"


class AppendNoteSchema(BaseModel):
    identifier: str = Field(description="Character or word to save the note to.")
    note_content: str = Field(description="The mnemonic or trick to remember.")


@tool(args_schema=AppendNoteSchema)
async def append_to_learning_notes(identifier: str, note_content: str, **kwargs) -> str:
    """Appends a personal note, trick, or mnemonic to the user's learning record for a specific Japanese character, slug, or word.
    Use this if the user explicitly asks you to save a note or remember a rule for a specific item.
    """
    user_id = kwargs.get("user_id", "INJECTED")
    jwt = kwargs.get("jwt", "SYSTEM_PROVIDED")
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        # Searching via MCP
        results = await client.call_tool(
            "search_knowledge", {"query": identifier}, jwt=jwt
        )
        if not results or "error" in str(results).lower():
            return f"Could not find any knowledge unit matching '{identifier}' to save the note to."

        return str(results)
    except Exception as e:
        logger.error(f"Error appending note: {e}")
        return f"Failed to append note: {str(e)}"


class LimitSchema(BaseModel):
    limit: int = Field(default=5, description="Number of results to return.")


@tool(args_schema=LimitSchema)
async def get_recent_reviews(limit: int = 5, **kwargs) -> str:
    """Retrieve the most recent words or characters the user has reviewed.
    Use this if the user asks 'What did I just study?' or 'How did my last session go?'.
    """
    user_id = kwargs.get("user_id", "INJECTED")
    jwt = kwargs.get("jwt", "SYSTEM_PROVIDED")
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        # Call MCP for data
        results = await client.call_tool("get_recent_reviews", {"limit": limit}, jwt=jwt)

        if not results:
            return "No recent reviews found."

        return str(results)
    except Exception as e:
        logger.error(f"Error getting recent reviews: {e}")
        return f"Failed to retrieve recent reviews: {str(e)}"


class EmptySchema(BaseModel):
    pass


@tool(args_schema=EmptySchema)
async def get_database_schema(**kwargs) -> str:
    """Retrieve the SQL database schema (tables, columns, types).
    Use this to see what data is available in the structured database before writing SQL.
    """
    user_id = kwargs.get("user_id", "INJECTED")
    jwt = kwargs.get("jwt", "SYSTEM_PROVIDED")
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        results = await client.call_tool("get_database_schema", {}, jwt=jwt)
        return str(results)
    except Exception as e:
        logger.error(f"Error getting schema: {e}")
        return f"Failed to retrieve schema: {str(e)}"


class SQLSchema(BaseModel):
    sql: str = Field(description="The SELECT query to execute.")


@tool(args_schema=SQLSchema)
async def execute_read_only_sql(sql: str, **kwargs) -> str:
    """Execute a read-only SELECT query against the database.
    ALWAYS call get_database_schema first to know the table names.
    Only SELECT/WITH queries are allowed.
    """
    user_id = kwargs.get("user_id", "INJECTED")
    jwt = kwargs.get("jwt", "SYSTEM_PROVIDED")
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        results = await client.call_tool("execute_read_only_sql", {"sql": sql}, jwt=jwt)
        return str(results)
    except Exception as e:
        logger.error(f"Error executing SQL: {e}")
        return f"Failed to execute SQL: {str(e)}"


class DueItemsLimitSchema(BaseModel):
    limit: int = Field(default=20, description="Max number of items to fetch.")


@tool(args_schema=DueItemsLimitSchema)
async def get_due_items(limit: int = 20, **kwargs) -> str:
    """Retrieve the characters or words that are due for review.
    Focus on items that the user needs to study right now.
    """
    user_id = kwargs.get("user_id", "INJECTED")
    jwt = kwargs.get("jwt", "SYSTEM_PROVIDED")
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        results = await client.call_tool("get_due_items", {"limit": limit}, jwt=jwt)
        if not results:
            return "No items are currently due for review."
        return str(results)
    except Exception as e:
        logger.error(f"Error getting due items: {e}")
        return f"Failed to retrieve due items: {str(e)}"


class ReviewSchema(BaseModel):
    item_id: str = Field(description="The UUID of the knowledge unit being reviewed.")
    rating: str = Field(description="The review result: 'pass' or 'again'.")
    facet: str = Field(default="meaning", description="Which part was reviewed (usually 'meaning').")


@tool(args_schema=ReviewSchema)
async def submit_review(item_id: str, rating: str, facet: str = "meaning", **kwargs) -> str:
    """Record a review result for a knowledge unit using FSRS logic.
    Ratings:
    - 'again': Complete failure to remember.
    - 'hard': Remembered with significant effort.
    - 'good' or 'pass': Remembered after a short hesitation.
    - 'easy': Remembered instantly.
    """
    user_id = kwargs.get("user_id", "INJECTED")
    jwt = kwargs.get("jwt", "SYSTEM_PROVIDED")
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        # Verify valid rating
        valid_ratings = ["again", "hard", "good", "pass", "easy"]
        if rating.lower() not in valid_ratings:
            return f"Error: rating must be one of {valid_ratings}."

        result = await client.call_tool(
            "submit_review",
            {"ku_id": item_id, "facet": facet, "rating": rating.lower(), "wrong_count": 0},
            jwt=jwt,
        )
        return f"Review recorded: {result}"
    except Exception as e:
        logger.error(f"Error submitting review: {e}")
        return f"Failed to submit review: {str(e)}"


# Tool list for the Planner
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
