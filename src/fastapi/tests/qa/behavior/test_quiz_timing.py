import pytest
from app.tutor.state import TutorSessionState, TutorStateMode
from app.tutor.engine import TutorEngine


def test_quiz_is_not_too_early():
    """Test Case: Quiz is NOT immediate."""

    # Given: User just started
    state = TutorSessionState(user_id="user_123")
    engine = TutorEngine(state)

    # When: Initial delivery
    response = engine.handle_user_input("learn")

    # Then: No quiz
    assert "quiz" not in response.lower()
    assert state.is_quiz_ready is False


def test_quiz_appears_after_batch_and_interaction():
    """Test Case: Quiz appears after appropriate conditions."""

    # Given: User delivered a full batch (4 lessons) and interacted
    state = TutorSessionState(user_id="user_123")
    engine = TutorEngine(state)
    engine.handle_user_input("learn")  # 3 lessons
    engine.handle_user_input("next")   # 4th lesson

    # When: User says "next" again (after 4 lessons)
    response = engine.handle_user_input("Next!")

    # Then: Quiz is suggested
    assert "quiz" in response.lower()
    assert state.is_quiz_ready is True
