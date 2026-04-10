from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from app.api.v1.endpoints.tutor import TutorChatRequest, tutor_chat


@pytest.mark.asyncio
async def test_chatbot_qa_learn_flow():
    with patch(
        "app.api.v1.endpoints.tutor.run_chat",
        new=AsyncMock(
            return_value={
                "response": "I can start a learn session and introduce a new batch before quizzing you.",
                "audio_file": None,
                "episodic_context": "",
                "semantic_context": "",
                "thread_context": "",
            }
        ),
    ) as mock_run_chat:
        response = await tutor_chat(
            TutorChatRequest(message="I want to learn a new batch now."),
            current_user={"id": "user-1", "jwt": "jwt-1"},
        )

    assert "learn" in response.reply.lower()
    mock_run_chat.assert_awaited_once()


@pytest.mark.asyncio
async def test_chatbot_qa_review_flow():
    with patch(
        "app.api.v1.endpoints.tutor.run_chat",
        new=AsyncMock(
            return_value={
                "response": "I can help you review your due queue and keep missed cards in rotation until you answer correctly.",
                "audio_file": None,
                "episodic_context": "",
                "semantic_context": "",
                "thread_context": "",
            }
        ),
    ) as mock_run_chat:
        response = await tutor_chat(
            TutorChatRequest(message="I want to review my due cards."),
            current_user={"id": "user-1", "jwt": "jwt-1"},
        )

    assert "review" in response.reply.lower()
    assert "correctly" in response.reply.lower()
    mock_run_chat.assert_awaited_once()
