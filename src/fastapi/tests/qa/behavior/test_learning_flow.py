import pytest
from app.tutor.state import TutorSessionState, TutorStateMode
from app.tutor.engine import TutorEngine


def test_starts_learning_delivers_lessons_no_quiz():
    """Test Case: User starts learning, system delivers lessons, NO quiz immediately."""

    # Given: A new session
    state = TutorSessionState(user_id="user_123")
    engine = TutorEngine(state)

    # When: The user says "I want to learn"
    response = engine.handle_user_input("Tôi muốn học tiếng Nhật")

    # Then: It should deliver multiple lessons (2-4)
    # The current engine delivers 3.
    assert "bài học mới" in response
    assert state.lessons_delivered == 3
    assert state.current_batch_count == 3
    assert state.mode == TutorStateMode.LEARNING

    # Then: NO quiz immediately after lesson
    assert "quiz" not in response.lower()
    assert state.is_quiz_ready is False
