from mcp.server.fastmcp import FastMCP

from app.adapters.http.learning import get_learning_service
from app.adapters.http.reading import get_reading_service
from app.domain.reading.models import AnswerSubmission
from app.domain.services.deck_service import DeckService

mcp = FastMCP("hanachan-domain-mcp")


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
