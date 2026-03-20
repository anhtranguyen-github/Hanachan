"""Tests for tutor agent tools backed by real Supabase SDK services."""

import uuid

import pytest

from app.agents.tutor_agent.merged_tools import (
    _deck_service,
    _learning_service,
    create_user_deck,
    get_user_learning_progress,
    list_my_decks,
    search_knowledge_units,
)
from app.core.supabase import get_supabase_client
from tests.conftest import TEST_USER_ID


@pytest.mark.asyncio
async def test_tool_get_user_learning_progress():
    """QA-ToolCall-01: get_user_learning_progress against real Supabase."""
    result = await get_user_learning_progress.coroutine(
        identifier="radical_barb", include_notes=False, user_id=TEST_USER_ID
    )
    assert isinstance(result, str)
    assert result  # non-empty


@pytest.mark.asyncio
async def test_tool_search_knowledge_units():
    """QA-ToolCall-02: search_knowledge_units against real Supabase."""
    result = await search_knowledge_units.coroutine(query="big")
    assert isinstance(result, str)
    assert result  # non-empty — should find "Big" radical at minimum


@pytest.mark.asyncio
async def test_tool_create_user_deck():
    """QA-ToolCall-03: create_user_deck against real Supabase."""
    deck_name = f"Test Deck {uuid.uuid4().hex[:8]}"
    result = await create_user_deck.coroutine(
        name=deck_name, description="Test deck", user_id=TEST_USER_ID
    )
    assert "Successfully created deck" in result

    # Cleanup
    sb = get_supabase_client()
    sb.table("decks").delete().eq("user_id", TEST_USER_ID).eq("name", deck_name).execute()


@pytest.mark.asyncio
async def test_tool_list_my_decks():
    """QA-ToolCall-04: list_my_decks against real Supabase."""
    result = await list_my_decks.coroutine(user_id=TEST_USER_ID)
    assert isinstance(result, str)
    # Test user has "Weather Mastery" deck
    assert "Weather Mastery" in result or "custom decks" in result
