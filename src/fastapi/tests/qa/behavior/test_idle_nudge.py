import pytest
from datetime import datetime, timezone, timedelta
from app.tutor.state import TutorSessionState
from app.tutor.idle import IdleDetector


def test_simulate_inactivity_sends_nudge():
    """Test Case: Inactivity triggers a nudge."""

    # Given: User just interacted
    state = TutorSessionState(user_id="user_123")
    state.record_interaction()

    # When: Over 10 minutes pass
    future_now = datetime.now(timezone.utc) + timedelta(minutes=10, seconds=1)

    # Then: It should require a nudge
    assert IdleDetector.check_inactivity(state, now=future_now) is True
    assert "Bạn vẫn đang học chứ?" in IdleDetector.get_nudge_message()


def test_recent_activity_no_nudge():
    """Test Case: Recent activity does not trigger nudge."""

    # Given: Just interacted
    state = TutorSessionState(user_id="user_123")
    state.record_interaction()

    # When: Just 5 minutes pass
    future_now = datetime.now(timezone.utc) + timedelta(minutes=5)

    # Then: NO nudge needed yet
    assert IdleDetector.check_inactivity(state, now=future_now) is False
