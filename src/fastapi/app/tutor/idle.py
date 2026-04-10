from __future__ import annotations
from datetime import datetime, timezone, timedelta
from app.tutor.state import TutorSessionState


class IdleDetector:
    """Detects inactivity and sends nudges."""

    # 10 minutes of inactivity
    IDLE_TIMEOUT_MINUTES = 10

    @staticmethod
    def check_inactivity(state: TutorSessionState, now: datetime | None = None) -> bool:
        """
        Calculates if the user's last interaction was long ago.
        Returns True if a nudge is required.
        """
        if now is None:
            now = datetime.now(timezone.utc)

        idle_time = now - state.last_interaction_at
        if idle_time >= timedelta(minutes=IdleDetector.IDLE_TIMEOUT_MINUTES):
            # Only nudge if they aren't already being nudged or in a quiz?
            # For simplicity, just return True if timing matches.
            return True

        return False

    @staticmethod
    def get_nudge_message() -> str:
        """Nudge message in Tiếng Việt as requested."""
        return "Bạn vẫn đang học chứ? Mình làm nhanh một câu quiz nhé 😊"
