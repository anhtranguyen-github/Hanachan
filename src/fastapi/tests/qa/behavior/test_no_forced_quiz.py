import pytest
from app.tutor.state import TutorSessionState, TutorStateMode
from app.tutor.engine import TutorEngine


def test_system_does_not_force_quiz():
    """Test Case: System maintains natural conversation even when quiz is suggested."""

    # Given: A user who was just suggested a quiz
    state = TutorSessionState(user_id="user_123")
    engine = TutorEngine(state)
    state.current_batch_count = 4
    response_suggest = engine.handle_user_input("next")
    assert "quiz" in response_suggest.lower()

    # When: The user COMPLETELY IGNORES the quiz suggestion and asks a question
    response_ignore = engine.handle_user_input("Tôi có thắc mắc bài 1")

    # Then: The system should help with the question, not force an answer.
    assert "hay quá" in response_ignore or "Tôi hiểu" in response_ignore
    assert state.mode == TutorStateMode.INTERACTING
