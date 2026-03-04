from abc import ABC, abstractmethod
from uuid import UUID
from typing import Optional, List
from .domain.reading.models import ReadingSession, ReadingExercise

class IReadingRepository(ABC):
    @abstractmethod
    async def get_session(self, session_id: UUID) -> Optional[ReadingSession]:
        pass

    @abstractmethod
    async def get_exercise(self, exercise_id: UUID) -> Optional[ReadingExercise]:
        pass

    @abstractmethod
    async def record_answer(
        self, 
        user_id: str, 
        exercise_id: UUID, 
        question_index: int, 
        user_answer: str, 
        is_correct: bool,
        time_spent_seconds: int
    ) -> None:
        pass
