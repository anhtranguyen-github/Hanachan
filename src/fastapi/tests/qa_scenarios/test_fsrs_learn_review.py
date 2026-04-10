from __future__ import annotations

from types import SimpleNamespace

import pytest

from app.agents.tutor_agent.merged_tools import evaluate_study_answer, prepare_study_card
from app.agents.tutor_agent.merged_tools import _choose_learning_facet
from app.domain.learning.models import Rating


class _FakeChatService:
    def __init__(self) -> None:
        self.sessions: dict[tuple[str, str], dict] = {}

    async def update_chat_session(
        self,
        user_id: str,
        session_id: str,
        *,
        metadata: dict | None = None,
        merge_metadata: bool = True,
        **_: object,
    ) -> dict:
        key = (user_id, session_id)
        current = self.sessions.get(key, {})
        existing_metadata = current.get("metadata", {})
        if metadata is None:
            new_metadata = existing_metadata
        elif merge_metadata:
            new_metadata = {**existing_metadata, **metadata}
        else:
            new_metadata = dict(metadata)
        current["metadata"] = new_metadata
        self.sessions[key] = current
        return current

    async def get_chat_session_metadata(self, user_id: str, session_id: str) -> dict:
        return self.sessions.get((user_id, session_id), {}).get("metadata", {})


class _FakeLearningService:
    def __init__(self) -> None:
        self.submissions: list[dict] = []

    async def submit_review(
        self,
        *,
        user_id: str,
        ku_id: str,
        facet: str,
        rating: Rating,
        wrong_count: int = 0,
    ) -> SimpleNamespace:
        submission = {
            "user_id": user_id,
            "ku_id": ku_id,
            "facet": facet,
            "rating": rating,
            "wrong_count": wrong_count,
        }
        self.submissions.append(submission)
        return SimpleNamespace(
            model_dump=lambda: {
                "item_id": ku_id,
                "facet": facet,
                "rating": rating.value,
                "wrong_count": wrong_count,
                "state": "review",
            }
        )


def test_choose_learning_facet_uses_meaning_for_grammar_lessons():
    assert _choose_learning_facet("grammar") == "meaning"


@pytest.mark.asyncio
async def test_qa_fsrs_learn_flow_tracks_wrong_answer_then_updates_review(monkeypatch):
    user_id = "qa-user"
    session_id = "qa-session-learn"
    chat_service = _FakeChatService()
    learning_service = _FakeLearningService()
    learn_card = {
        "mode": "learn",
        "item_id": "ku-learn-1",
        "slug": "neko",
        "character": "猫",
        "meaning": "cat",
        "ku_type": "vocabulary",
        "level": 1,
        "facet": "meaning",
        "prompt": "What is the meaning of 猫?",
        "correct_answers": ["cat"],
        "wrong_count": 0,
    }

    async def _fake_fetch_next_learning_card(*args, **kwargs):
        return dict(learn_card)

    monkeypatch.setattr("app.agents.tutor_agent.merged_tools._chat_service", lambda: chat_service)
    monkeypatch.setattr("app.agents.tutor_agent.merged_tools._learning_service", lambda: learning_service)
    monkeypatch.setattr(
        "app.agents.tutor_agent.merged_tools._fetch_next_learning_card",
        _fake_fetch_next_learning_card,
    )

    prepared = await prepare_study_card.coroutine(mode="learn", user_id=user_id, session_id=session_id)
    assert "Study card ready." in prepared
    assert "Mode: learn" in prepared
    assert "Prompt: What is the meaning of 猫?" in prepared

    incorrect = await evaluate_study_answer.coroutine(
        user_answer="dog",
        user_id=user_id,
        session_id=session_id,
    )
    assert "Incorrect answer" in incorrect
    assert "Wrong Count: 1" in incorrect
    active_card = await chat_service.get_chat_session_metadata(user_id, session_id)
    assert active_card["active_study_card"]["wrong_count"] == 1

    correct = await evaluate_study_answer.coroutine(
        user_answer="cat",
        user_id=user_id,
        session_id=session_id,
    )
    assert "Correct." in correct
    assert "Canonical Answer: cat" in correct
    assert "FSRS Updated:" in correct
    assert learning_service.submissions == [
        {
            "user_id": user_id,
            "ku_id": "ku-learn-1",
            "facet": "meaning",
            "rating": Rating.PASS,
            "wrong_count": 1,
        }
    ]
    cleared = await chat_service.get_chat_session_metadata(user_id, session_id)
    assert cleared["active_study_card"] is None


@pytest.mark.asyncio
async def test_qa_fsrs_learn_flow_in_local_mode_uses_in_memory_card_store(monkeypatch):
    learning_service = _FakeLearningService()
    learn_card = {
        "mode": "learn",
        "item_id": "ku-local-1",
        "slug": "sora",
        "character": "空",
        "meaning": "sky",
        "ku_type": "vocabulary",
        "level": 1,
        "facet": "meaning",
        "prompt": "What is the meaning of 空?",
        "correct_answers": ["sky"],
        "wrong_count": 0,
    }

    async def _fake_fetch_next_learning_card(*args, **kwargs):
        return dict(learn_card)

    monkeypatch.setattr("app.agents.tutor_agent.merged_tools._learning_service", lambda: learning_service)
    monkeypatch.setattr(
        "app.agents.tutor_agent.merged_tools._fetch_next_learning_card",
        _fake_fetch_next_learning_card,
    )

    prepared = await prepare_study_card.coroutine(
        mode="learn",
        user_id="cli-user",
        session_id="cli-session",
        persist_artifacts=False,
    )
    assert "Mode: learn" in prepared

    result = await evaluate_study_answer.coroutine(
        user_answer="sky",
        user_id="cli-user",
        session_id="cli-session",
        persist_artifacts=False,
    )
    assert "Correct." in result
    assert "ku-local-1" in result
    assert "local-practice" in result


@pytest.mark.asyncio
async def test_qa_fsrs_review_flow_loads_due_card_and_submits_pass(monkeypatch):
    user_id = "qa-user"
    session_id = "qa-session-review"
    chat_service = _FakeChatService()
    learning_service = _FakeLearningService()
    review_card = {
        "mode": "review",
        "item_id": "ku-review-1",
        "slug": "inu",
        "character": "犬",
        "meaning": "dog",
        "ku_type": "vocabulary",
        "level": 1,
        "facet": "meaning",
        "prompt": "What is the meaning of 犬?",
        "correct_answers": ["dog"],
        "wrong_count": 0,
    }

    async def _fake_fetch_next_review_card(*args, **kwargs):
        return dict(review_card)

    monkeypatch.setattr("app.agents.tutor_agent.merged_tools._chat_service", lambda: chat_service)
    monkeypatch.setattr("app.agents.tutor_agent.merged_tools._learning_service", lambda: learning_service)
    monkeypatch.setattr(
        "app.agents.tutor_agent.merged_tools._fetch_next_review_card",
        _fake_fetch_next_review_card,
    )

    prepared = await prepare_study_card.coroutine(mode="review", user_id=user_id, session_id=session_id)
    assert "Study card ready." in prepared
    assert "Mode: review" in prepared
    assert "Item ID: ku-review-1" in prepared

    result = await evaluate_study_answer.coroutine(
        user_answer="dog",
        user_id=user_id,
        session_id=session_id,
    )
    assert "Correct." in result
    assert "Facet: meaning" in result
    assert learning_service.submissions == [
        {
            "user_id": user_id,
            "ku_id": "ku-review-1",
            "facet": "meaning",
            "rating": Rating.PASS,
            "wrong_count": 0,
        }
    ]
    cleared = await chat_service.get_chat_session_metadata(user_id, session_id)
    assert cleared["active_study_card"] is None


@pytest.mark.asyncio
async def test_qa_fsrs_accepts_split_meaning_variants(monkeypatch):
    user_id = "qa-user"
    session_id = "qa-session-variants"
    chat_service = _FakeChatService()
    learning_service = _FakeLearningService()
    learn_card = {
        "mode": "learn",
        "item_id": "ku-variant-1",
        "slug": "grammar_aru",
        "character": "がある + Noun",
        "meaning": "Noun (B) that has Noun (A), Noun (B) with Noun (A)",
        "ku_type": "grammar",
        "level": 1,
        "facet": "meaning",
        "prompt": "What is the meaning of がある + Noun?",
        "correct_answers": ["Noun (B) that has Noun (A), Noun (B) with Noun (A)"],
        "wrong_count": 0,
    }

    async def _fake_fetch_next_learning_card(*args, **kwargs):
        return dict(learn_card)

    monkeypatch.setattr("app.agents.tutor_agent.merged_tools._chat_service", lambda: chat_service)
    monkeypatch.setattr("app.agents.tutor_agent.merged_tools._learning_service", lambda: learning_service)
    monkeypatch.setattr(
        "app.agents.tutor_agent.merged_tools._fetch_next_learning_card",
        _fake_fetch_next_learning_card,
    )

    await prepare_study_card.coroutine(mode="learn", user_id=user_id, session_id=session_id)
    result = await evaluate_study_answer.coroutine(
        user_answer="Noun (B) with Noun (A)",
        user_id=user_id,
        session_id=session_id,
    )

    assert "Correct." in result
