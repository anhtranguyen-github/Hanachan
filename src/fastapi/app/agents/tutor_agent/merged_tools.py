import logging
import re
from typing import Any
from datetime import datetime, timezone
from uuid import UUID as UUIDType
from uuid import UUID

from langchain_core.tools import tool
from pydantic import BaseModel, Field

from app.core.supabase import get_supabase_client
from app.domain.chat.services import ChatService
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
_LOCAL_STUDY_CARDS: dict[tuple[str, str], dict[str, Any] | None] = {}


def _learning_service() -> LearningService:
    return LearningService(SupabaseLearningRepository(get_supabase_client()))


def _deck_service() -> DeckService:
    return DeckService(get_supabase_client())


def _chat_service() -> ChatService:
    return ChatService(get_supabase_client())


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


class StudyCardSchema(BaseModel):
    mode: str = Field(default="review", description="Either 'learn' or 'review'.")
    limit: int = Field(default=10, description="How many candidate items to scan.")
    unit_type: str | None = Field(default=None, description="Optional KU type filter.")
    level: int | None = Field(default=None, description="Optional curriculum level filter.")


class StudyAnswerSchema(BaseModel):
    user_answer: str = Field(description="The learner's answer to the active study card.")


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


def _normalize_text(value: str) -> str:
    text = value.strip().lower()
    text = re.sub(r"\s+", " ", text)
    return text


def _normalize_reading(value: str) -> str:
    text = _normalize_text(value)
    return re.sub(r"[\s・/／\-ー]+", "", text)


def _normalize_answer(value: str, facet: str) -> str:
    return _normalize_reading(value) if facet == "reading" else _normalize_text(value)


def _expand_expected_answers(expected_answers: list[str], facet: str) -> list[str]:
    expanded: list[str] = []
    for answer in expected_answers:
        text = str(answer or "").strip()
        if not text:
            continue
        expanded.append(text)
        if facet in {"meaning", "cloze"}:
            parts = [part.strip() for part in re.split(r"[;,]|\bor\b", text, flags=re.IGNORECASE) if part.strip()]
            expanded.extend(parts)
    seen: set[str] = set()
    deduped: list[str] = []
    for answer in expanded:
        normalized = _normalize_answer(answer, facet)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        deduped.append(answer)
    return deduped


def _is_uuid(value: str) -> bool:
    try:
        UUIDType(str(value))
        return True
    except ValueError:
        return False


def _select_question_field(client: Any) -> str:
    # The canonical schema uses ku_id, but some transitional code paths still expect item_id.
    # Probe once cheaply via schema cache would be nicer; using ku_id by default is sufficient here.
    return "ku_id"


async def _fetch_knowledge_unit(identifier: str) -> dict[str, Any] | None:
    client = get_supabase_client()
    if _is_uuid(identifier):
        res = (
            client.table("knowledge_units")
            .select("id, slug, type, level, character, meaning")
            .eq("id", identifier)
            .maybe_single()
            .execute()
        )
        return res.data if res and res.data else None

    results = await _learning_service().search_knowledge(identifier, 1)
    if not results:
        return None
    ku = results[0]
    return ku.model_dump()


def _fetch_question_for_ku(ku_id: str, facet: str) -> dict[str, Any] | None:
    client = get_supabase_client()
    key = _select_question_field(client)
    res = (
        client.table("questions")
        .select("*")
        .eq(key, ku_id)
        .eq("facet", facet)
        .maybe_single()
        .execute()
    )
    return res.data if res and res.data else None


def _fetch_unit_details(ku_id: str, ku_type: str) -> dict[str, Any]:
    client = get_supabase_client()
    table_by_type = {
        "radical": "radical_details",
        "kanji": "kanji_details",
        "vocabulary": "vocabulary_details",
        "grammar": "grammar_details",
    }
    table_name = table_by_type.get(ku_type)
    if not table_name:
        return {}
    res = client.table(table_name).select("*").eq("ku_id", ku_id).maybe_single().execute()
    return res.data if res and res.data else {}


def _build_study_card_payload(ku: dict[str, Any], facet: str, mode: str) -> dict[str, Any] | None:
    question = _fetch_question_for_ku(ku["id"], facet)
    details = _fetch_unit_details(ku["id"], ku["type"])
    if facet == "reading":
        readings = []
        if ku["type"] == "kanji":
            readings.extend(details.get("onyomi") or [])
            readings.extend(details.get("kunyomi") or [])
        elif ku["type"] == "vocabulary":
            reading = details.get("reading")
            if reading:
                readings.append(reading)
        correct_answers = question.get("correct_answers") if question else readings
    elif facet == "cloze":
        correct_answers = question.get("correct_answers") if question else [ku.get("character") or ku["meaning"]]
    else:
        correct_answers = question.get("correct_answers") if question else [ku["meaning"]]

    if not correct_answers:
        return None

    prompt = (
        question.get("prompt")
        if question and question.get("prompt")
        else (
            f"What is the reading of {ku.get('character') or ku['meaning']}?"
            if facet == "reading"
            else (
                question.get("cloze_text_with_blanks")
                if facet == "cloze" and question
                else f"What is the meaning of {ku.get('character') or ku['meaning']}?"
            )
        )
    )

    return {
        "mode": mode,
        "item_id": ku["id"],
        "slug": ku.get("slug"),
        "character": ku.get("character"),
        "meaning": ku.get("meaning"),
        "ku_type": ku.get("type"),
        "level": ku.get("level"),
        "facet": facet,
        "prompt": prompt,
        "correct_answers": correct_answers,
        "wrong_count": 0,
    }


def _choose_learning_facet(ku_type: str) -> str:
    return "meaning"


async def _fetch_next_learning_card(
    user_id: str,
    *,
    limit: int,
    unit_type: str | None = None,
    level: int | None = None,
) -> dict[str, Any] | None:
    client = get_supabase_client()
    try:
        learned_res = client.table("user_fsrs_states").select("item_id").eq("user_id", user_id).execute()
        learned_ids = [item["item_id"] for item in (learned_res.data or [])]
    except Exception:
        learned_ids = []

    query = client.table("knowledge_units").select("id, slug, type, level, character, meaning").order("level").limit(limit)
    if unit_type:
        query = query.eq("type", unit_type)
    if level is not None:
        query = query.eq("level", level)
    res = query.execute()
    for ku in res.data or []:
        if ku["id"] in learned_ids:
            continue
        card = _build_study_card_payload(ku, _choose_learning_facet(ku["type"]), "learn")
        if card:
            return card
    return None


async def _fetch_next_review_card(
    user_id: str,
    *,
    limit: int,
    unit_type: str | None = None,
    level: int | None = None,
) -> dict[str, Any] | None:
    client = get_supabase_client()
    now = datetime.now(timezone.utc).isoformat()
    query = (
        client.table("user_fsrs_states")
        .select("item_id, facet, knowledge_units(id, slug, type, level, character, meaning)")
        .eq("user_id", user_id)
        .eq("item_type", "ku")
        .neq("state", "burned")
        .lte("next_review", now)
        .order("next_review")
        .limit(limit)
    )
    res = query.execute()
    for row in res.data or []:
        ku = row.get("knowledge_units") or {}
        if unit_type and ku.get("type") != unit_type:
            continue
        if level is not None and ku.get("level") != level:
            continue
        card = _build_study_card_payload(ku, row.get("facet") or "meaning", "review")
        if card:
            return card
    return None


def _local_study_key(user_id: str, session_id: str) -> tuple[str, str]:
    return (str(user_id), str(session_id))


def _use_local_study_state(session_id: str | None, persist_artifacts: bool) -> bool:
    return bool(session_id) and not persist_artifacts


async def _store_active_study_card(
    user_id: str,
    session_id: str,
    card: dict[str, Any] | None,
    *,
    persist_artifacts: bool = True,
) -> None:
    if _use_local_study_state(session_id, persist_artifacts):
        _LOCAL_STUDY_CARDS[_local_study_key(user_id, session_id)] = card
        return
    metadata = {"active_study_card": card}
    await _chat_service().update_chat_session(user_id, session_id, metadata=metadata, merge_metadata=True)


async def _load_active_study_card(
    user_id: str,
    session_id: str | None,
    *,
    persist_artifacts: bool = True,
) -> dict[str, Any] | None:
    if not session_id:
        return None
    if _use_local_study_state(session_id, persist_artifacts):
        return _LOCAL_STUDY_CARDS.get(_local_study_key(user_id, session_id))
    metadata = await _chat_service().get_chat_session_metadata(user_id, session_id)
    return metadata.get("active_study_card")


async def _peek_active_study_card(
    user_id: str,
    session_id: str | None,
    *,
    persist_artifacts: bool = True,
) -> dict[str, Any] | None:
    return await _load_active_study_card(
        user_id,
        session_id,
        persist_artifacts=persist_artifacts,
    )


def _format_study_card_for_tutor(card: dict[str, Any]) -> str:
    character = card.get("character") or card.get("meaning") or card.get("slug") or card["item_id"]
    hint = ""
    if card["mode"] == "learn":
        hint = f"Teach this item briefly, then quiz the learner.\nMeaning: {card.get('meaning')}"
    return (
        f"Study card ready.\n"
        f"Mode: {card['mode']}\n"
        f"Item ID: {card['item_id']}\n"
        f"Slug: {card.get('slug')}\n"
        f"Type: {card.get('ku_type')}\n"
        f"Facet: {card['facet']}\n"
        f"Character: {character}\n"
        f"Prompt: {card['prompt']}\n"
        f"{hint}".rstrip()
    )


def _evaluate_card_answer(card: dict[str, Any], user_answer: str) -> tuple[bool, list[str], str]:
    facet = card.get("facet", "meaning")
    expected_answers = _expand_expected_answers(card.get("correct_answers") or [], facet)
    normalized_input = _normalize_answer(user_answer, facet)
    normalized_expected = [_normalize_answer(answer, facet) for answer in expected_answers]
    is_correct = normalized_input in normalized_expected
    canonical = expected_answers[0] if expected_answers else ""
    return is_correct, expected_answers, canonical


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


@tool(args_schema=StudyCardSchema)
async def prepare_study_card(
    mode: str = "review",
    limit: int = 10,
    unit_type: str | None = None,
    level: int | None = None,
    **kwargs,
) -> str:
    """Select the next lesson/review card, persist it in thread metadata, and return the prompt."""
    user_id = kwargs.get("user_id", "INJECTED")
    session_id = kwargs.get("session_id")
    persist_artifacts = bool(kwargs.get("persist_artifacts", True))
    if not session_id:
        return "Error: an active chat session is required for study mode."

    mode = (mode or "review").lower()
    if mode not in {"learn", "review"}:
        return "Error: mode must be either 'learn' or 'review'."

    if mode == "learn":
        card = await _fetch_next_learning_card(user_id, limit=limit, unit_type=unit_type, level=level)
    else:
        card = await _fetch_next_review_card(user_id, limit=limit, unit_type=unit_type, level=level)

    if not card:
        await _store_active_study_card(user_id, session_id, None, persist_artifacts=persist_artifacts)
        return f"No {mode} card is currently available."

    await _store_active_study_card(user_id, session_id, card, persist_artifacts=persist_artifacts)
    return _format_study_card_for_tutor(card)


@tool(args_schema=StudyAnswerSchema)
async def evaluate_study_answer(user_answer: str, **kwargs) -> str:
    """Evaluate the learner's answer against the active study card and update FSRS on success."""
    user_id = kwargs.get("user_id", "INJECTED")
    session_id = kwargs.get("session_id")
    persist_artifacts = bool(kwargs.get("persist_artifacts", True))
    active = await _load_active_study_card(user_id, session_id, persist_artifacts=persist_artifacts)
    if not active:
        return "Error: there is no active study card. Call prepare_study_card first."

    is_correct, expected_answers, canonical = _evaluate_card_answer(active, user_answer)
    wrong_count = int(active.get("wrong_count") or 0)

    if not is_correct:
        active["wrong_count"] = wrong_count + 1
        await _store_active_study_card(
            user_id,
            session_id,
            active,
            persist_artifacts=persist_artifacts,
        )
        return (
            f"Incorrect answer for the current {active['facet']} card.\n"
            f"Mode: {active['mode']}\n"
            f"Item ID: {active['item_id']}\n"
            f"Wrong Count: {active['wrong_count']}\n"
            f"Prompt: {active['prompt']}\n"
            "Do not reveal the answer immediately unless the learner explicitly asks."
        )

    if persist_artifacts:
        result_payload = (
            await _learning_service().submit_review(
                user_id=user_id,
                ku_id=active["item_id"],
                facet=active["facet"],
                rating=Rating.PASS,
                wrong_count=wrong_count,
            )
        ).model_dump()
    else:
        result_payload = {
            "item_id": active["item_id"],
            "facet": active["facet"],
            "rating": Rating.PASS.value,
            "wrong_count": wrong_count,
            "state": "local-practice",
        }
    await _store_active_study_card(user_id, session_id, None, persist_artifacts=persist_artifacts)
    return (
        f"Correct.\n"
        f"Item ID: {active['item_id']}\n"
        f"Facet: {active['facet']}\n"
        f"Accepted Answers: {expected_answers}\n"
        f"Canonical Answer: {canonical}\n"
        f"FSRS Updated: {result_payload}"
    )


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
            wrong_count=int(kwargs.get("wrong_count") or 0),
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
    prepare_study_card,
    evaluate_study_answer,
    search_knowledge_units,
    append_to_learning_notes,
    get_database_schema,
    execute_read_only_sql,
    submit_review,
] + DECK_TOOLS
