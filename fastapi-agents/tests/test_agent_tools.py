from unittest.mock import AsyncMock, patch

import pytest

from app.agents.deck_manager import create_user_deck, list_my_decks
from app.agents.memory_agent import get_user_learning_progress, search_knowledge_units


@pytest.mark.asyncio
async def test_tool_get_user_learning_progress():
    """QA-ToolCall-01: Memory Agent MCP Tool Usage"""
    with patch(
        "app.services.mcp_domain_client.MCPDomainClient.call_tool", new_callable=AsyncMock
    ) as mock_call:
        mock_call.return_value = '{"stage": "review", "stability": 4.5}'

        result = await get_user_learning_progress.ainvoke(
            {"jwt": "jwt123", "identifier": "桜", "include_notes": False, "user_id": "u1"}
        )

        assert "review" in result
        mock_call.assert_awaited_once_with(
            "get_learning_progress", {"user_id": "u1", "identifier": "桜"}
        )


@pytest.mark.asyncio
async def test_tool_search_knowledge_units():
    """QA-ToolCall-02: Memory Agent Knowledge Search MCP"""
    with patch(
        "app.services.mcp_domain_client.MCPDomainClient.call_tool", new_callable=AsyncMock
    ) as mock_call:
        mock_call.return_value = '{"id": "ku123", "meaning": "cherry blossom"}'

        result = await search_knowledge_units.ainvoke(
            {"jwt": "jwt", "query": "sakura", "user_id": "u1"}
        )

        assert "cherry blossom" in result
        mock_call.assert_awaited_once_with("search_knowledge", {"user_id": "u1", "query": "sakura"})


@pytest.mark.asyncio
async def test_tool_create_user_deck():
    """QA-ToolCall-03: Deck Manager Create Deck MCP"""
    with patch(
        "app.services.mcp_domain_client.MCPDomainClient.call_tool", new_callable=AsyncMock
    ) as mock_call:
        mock_call.return_value = '{"id": "deck123", "name": "JLPT N2"}'

        result = await create_user_deck.ainvoke(
            {"name": "JLPT N2", "jwt": "token123", "description": "N2 Vocab", "user_id": "user1"}
        )

        assert "Successfully created deck" in result
        mock_call.assert_awaited_once_with(
            "create_deck", {"user_id": "user1", "name": "JLPT N2", "description": "N2 Vocab"}
        )


@pytest.mark.asyncio
async def test_tool_list_my_decks():
    """QA-ToolCall-04: Deck Manager List MCP fallback"""
    with patch(
        "app.services.mcp_domain_client.MCPDomainClient.call_tool", new_callable=AsyncMock
    ) as mock_call:
        mock_call.return_value = "[]"

        result = await list_my_decks.ainvoke({"jwt": "jwt", "user_id": "u2"})

        assert "You don't have any custom decks yet" in result
        mock_call.assert_awaited_once_with("list_decks", {"user_id": "u2"})
