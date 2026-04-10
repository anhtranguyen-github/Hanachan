from __future__ import annotations
from datetime import datetime, timezone, timedelta
from app.tutor.state import TutorSessionState


class QuizStrategy:
    """Strategy for timing quizzes naturally."""

    # ── Thresholds ─────────────────────────────────────────
    MIN_BATCH_LESSONS = 2
    MAX_BATCH_LESSONS = 4
    # Minimum interactive messages before a quiz
    MIN_INTERACTIONS = 2

    @staticmethod
    def evaluate(state: TutorSessionState) -> bool:
        """
        Evaluate if it's time to suggest a quiz.
        Returns True if a quiz should be suggested.
        """
        # NO quiz if we haven't delivered minimum batch content
        if state.current_batch_count < QuizStrategy.MIN_BATCH_LESSONS:
            return False

        # If user has already been asked or is in a quiz, handled elsewhere.

        # Condition 1: Delievered enough lessons and interacted enough.
        # len(state.understanding_indicators) acts as interaction count for now.
        if (state.current_batch_count >= QuizStrategy.MIN_BATCH_LESSONS and
            len(state.understanding_indicators) >= QuizStrategy.MIN_INTERACTIONS):
            return True

        # Condition 2: Cap after MAX_BATCH_LESSONS even if less interaction.
        if state.current_batch_count >= QuizStrategy.MAX_BATCH_LESSONS:
            return True

        return False
