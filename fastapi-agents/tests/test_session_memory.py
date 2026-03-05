from unittest.mock import patch

import pytest

from app.services.memory import session_memory


@pytest.mark.asyncio
async def test_create_session():
    """QA-Session-01: Test creating a session"""
    mock_response = {"session_id": "mock-sess-id"}
    with patch("app.core.domain_client.DomainClient.upsert_chat_session", return_value=mock_response) as mock_upsert:
        session_id = await session_memory.create_session("jwt123", "user123")
        assert session_id == "mock-sess-id"
        mock_upsert.assert_awaited_once()

@pytest.mark.asyncio
async def test_get_session_success():
    """QA-Session-02: Test getting a session details"""
    mock_response = {"session_id": "sass-123", "title": "Test Title"}
    with patch("app.core.domain_client.DomainClient.get_chat_session", return_value=mock_response) as mock_get:
        session = await session_memory.get_session("jwt123", "sass-123")
        assert session["title"] == "Test Title"
        mock_get.assert_awaited_once_with("sass-123")

@pytest.mark.asyncio
async def test_get_messages():
    """QA-Session-03: Test retrieving messages for a session"""
    mock_msgs = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there"}
    ]
    with patch("app.core.domain_client.DomainClient.get_chat_messages", return_value=mock_msgs):
        msgs = await session_memory.get_messages("jwt", "sess1")
        assert len(msgs) == 2
        assert msgs[0]["content"] == "Hello"

@pytest.mark.asyncio
async def test_get_thread_context_text():
    """QA-Session-Context: Test formatting of thread context"""
    mock_msgs = [
        {"role": "user", "content": "What is kanji?"},
        {"role": "assistant", "content": "Kanji are characters."},
        {"role": "user", "content": "Thank you."}
    ]
    with patch("app.core.domain_client.DomainClient.get_chat_messages", return_value=mock_msgs):
        context = await session_memory.get_thread_context_text("jwt", "sess1", last_n=2)
        # Should only get the last 2 messages
        assert "What is kanji?" not in context
        assert "Assistant: Kanji are characters." in context
        assert "User: Thank you." in context
