import logging

from langchain_core.tools import tool

from app.agents.deck_manager import DECK_TOOLS
from app.core.config import settings
from app.mcp.client import McpClient
from app.services.memory import episodic_memory as ep_mem
from app.services.memory import semantic_memory as sem_mem

logger = logging.getLogger(__name__)


@tool
def get_episodic_memory(query: str, user_id: str = "INJECTED") -> str:
    """Search past conversation summaries for context about a user's history or preferences.
    Use this if you need to remember what we talked about in previous sessions.
    (Note: user_id is handled automatically)
    """
    results = ep_mem.search_episodic_memory(user_id, query, k=3)
    if not results:
        return "No relevant past conversations found."
    return "\n".join([f"- {r.text} (Context score: {r.score})" for r in results])


@tool
def get_semantic_facts(keywords: list[str], user_id: str = "INJECTED") -> str:
    """Search structured facts about the user (interests, goals, preferred settings).
    Use this for specific factual questions about the person.
    (Note: user_id is handled automatically)
    """
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


@tool
async def get_user_learning_progress(
    jwt: str, identifier: str, include_notes: bool = False, user_id: str = "INJECTED"
) -> str:
    """Retrieve live learning stats for a specific Japanese character or slug.
    Identifiers can be Kanji (e.g. '桜'), Slugs (e.g. 'sakura'), or Words.
    If include_notes is True, it will also return the user's personal/agent notes for this item.
    (Note: user_id is handled automatically)
    """
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        # Call via MCP Tool
        status_data = await client.call_tool(
            "get_learning_progress", {"user_id": user_id, "identifier": identifier}, jwt=jwt
        )

        if not status_data:
            return f"No learning record found for '{identifier}'."

        return str(status_data)
    except Exception as e:
        logger.error(f"Error getting learning progress: {e}")
        return f"Failed to retrieve learning progress: {str(e)}"


@tool
async def search_knowledge_units(jwt: str, query: str, user_id: str = "INJECTED") -> str:
    """Search the general Japanese knowledge database for meanings, characters, or slugs.
    Use this if the user asks 'What does X mean?' or 'How do you write Y?'.
    """
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        results = await client.call_tool("search_knowledge", {"user_id": user_id, "query": query}, jwt=jwt)

        if not results:
            return f"No knowledge units found for '{query}'."
        return str(results)
    except Exception as e:
        logger.error(f"Error searching knowledge: {e}")
        return f"Failed to search knowledge: {str(e)}"


@tool
async def append_to_learning_notes(
    jwt: str, identifier: str, note_content: str, user_id: str = "INJECTED"
) -> str:
    """Appends a personal note, trick, or mnemonic to the user's learning record for a specific Japanese character, slug, or word.
    Use this if the user explicitly asks you to save a note or remember a rule for a specific item.
    """
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        # Searching via MCP
        results = await client.call_tool(
            "search_knowledge", {"user_id": user_id, "query": identifier}, jwt=jwt
        )
        if not results or "error" in str(results).lower():
            return f"Could not find any knowledge unit matching '{identifier}' to save the note to."

        return str(results)
    except Exception as e:
        logger.error(f"Error appending note: {e}")
        return f"Failed to append note: {str(e)}"


@tool
async def get_recent_reviews(jwt: str, limit: int = 5, user_id: str = "INJECTED") -> str:
    """Retrieve the most recent words or characters the user has reviewed.
    Use this if the user asks 'What did I just study?' or 'How did my last session go?'.
    """
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        # Call MCP for data
        results = await client.call_tool("get_recent_reviews", {"user_id": user_id, "limit": limit}, jwt=jwt)

        if not results:
            return "No recent reviews found."

        return str(results)
    except Exception as e:
        logger.error(f"Error getting recent reviews: {e}")
        return f"Failed to retrieve recent reviews: {str(e)}"


@tool
async def get_database_schema(jwt: str, user_id: str = "INJECTED") -> str:
    """Retrieve the SQL database schema (tables, columns, types).
    Use this to see what data is available in the structured database before writing SQL.
    """
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        results = await client.call_tool("get_database_schema", {"user_id": user_id}, jwt=jwt)
        return str(results)
    except Exception as e:
        logger.error(f"Error getting schema: {e}")
        return f"Failed to retrieve schema: {str(e)}"


@tool
async def execute_read_only_sql(jwt: str, sql: str, user_id: str = "INJECTED") -> str:
    """Execute a read-only SELECT query against the database.
    ALWAYS call get_database_schema first to know the table names.
    Only SELECT/WITH queries are allowed.
    """
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        results = await client.call_tool("execute_read_only_sql", {"user_id": user_id, "sql": sql}, jwt=jwt)
        return str(results)
    except Exception as e:
        logger.error(f"Error executing SQL: {e}")
        return f"Failed to execute SQL: {str(e)}"


# Tool list for the Planner
TOOLS = [
    get_episodic_memory,
    get_semantic_facts,
    get_user_learning_progress,
    get_recent_reviews,
    search_knowledge_units,
    append_to_learning_notes,
    get_database_schema,
    execute_read_only_sql,
] + DECK_TOOLS
