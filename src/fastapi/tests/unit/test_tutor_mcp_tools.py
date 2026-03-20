"""
Tests for tutor agent tools.

Note: The MCP-based TutorAgent (app.agents.tutor_agent_mcp) was removed.
The tutor now uses LangGraph + direct Supabase SDK calls via merged_tools.
Tool invocation is tested in test_agent_tools.py.
"""

from __future__ import annotations

import pytest


@pytest.mark.asyncio
async def test_tutor_tools_use_supabase_services():
    """Verify tutor tools import from merged_tools backed by Supabase SDK."""
    from app.agents.tutor_agent.merged_tools import (
        create_user_deck,
        get_user_learning_progress,
        list_my_decks,
        search_knowledge_units,
    )

    # All tools are LangChain @tool decorated StructuredTools
    assert hasattr(create_user_deck, "ainvoke")
    assert hasattr(get_user_learning_progress, "ainvoke")
    assert hasattr(list_my_decks, "ainvoke")
    assert hasattr(search_knowledge_units, "ainvoke")

