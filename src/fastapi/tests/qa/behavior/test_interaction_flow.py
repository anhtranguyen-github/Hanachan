import pytest
from app.tutor.state import TutorSessionState, TutorStateMode
from app.tutor.engine import TutorEngine


def test_interaction_more_examples():
    """Test Case: User asks 'more examples' during lesson."""

    # Given: User just started a lesson
    state = TutorSessionState(user_id="user_123")
    engine = TutorEngine(state)
    engine.handle_user_input("Tiếp tục học nào")

    # When: The user asks for more examples
    response = engine.handle_user_input("Cho mình thêm ví dụ đi")

    # Then: Respond with more examples, not a quiz or next lesson
    assert "ví dụ" in response.lower()
    assert state.mode == TutorStateMode.INTERACTING
    assert len(state.understanding_indicators) > 0


def test_interaction_next():
    """Test Case: User says 'next' to continue lesson."""

    # Given: User just starting
    state = TutorSessionState(user_id="user_123")
    engine = TutorEngine(state)
    engine.handle_user_input("start")

    # When: The user says "next"
    response = engine.handle_user_input("tiếp đi")

    # Then: Deliver next lesson
    assert "Bài học số" in response
    assert state.lessons_delivered > 3  # Initial 3 + 1
