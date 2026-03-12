from abc import ABC, abstractmethod
from uuid import UUID

from app.core.reading.models import ReadingExercise, ReadingSession


class IReadingRepository(ABC):
    @abstractmethod
    async def get_session(self, session_id: UUID) -> ReadingSession | None:
        pass

    @abstractmethod
    async def get_exercise(self, exercise_id: UUID) -> ReadingExercise | None:
        pass

    @abstractmethod
    async def record_answer(
        self,
        user_id: str,
        exercise_id: UUID,
        question_index: int,
        user_answer: str,
        is_correct: bool,
        time_spent_seconds: int,
    ) -> None:
        pass
