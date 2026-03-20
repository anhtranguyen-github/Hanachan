from abc import ABC, abstractmethod
from uuid import UUID

from supabase import Client

from app.domain.reading.models import ReadingExercise, ReadingQuestion, ReadingSession


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


class SupabaseReadingRepository(IReadingRepository):
    def __init__(self, client: Client):
        self.client = client

    async def get_session(self, session_id: UUID) -> ReadingSession | None:
        response = (
            self.client.table("reading_sessions").select("*").eq("id", str(session_id)).execute()
        )
        if not response.data:
            return None
        data = response.data[0]
        return ReadingSession(**data)

    async def get_exercise(self, exercise_id: UUID) -> ReadingExercise | None:
        response = (
            self.client.table("reading_exercises").select("*").eq("id", str(exercise_id)).execute()
        )
        if not response.data:
            return None
        data = response.data[0]
        return ReadingExercise(
            id=data["id"],
            session_id=data["session_id"],
            questions=[ReadingQuestion(**q) for q in data["questions"]],
            order_index=data["order_index"],
        )

    async def record_answer(
        self,
        user_id: str,
        exercise_id: UUID,
        question_index: int,
        user_answer: str,
        is_correct: bool,
        time_spent_seconds: int,
    ) -> None:
        payload = {
            "user_id": user_id,
            "exercise_id": str(exercise_id),
            "question_index": question_index,
            "user_answer": user_answer,
            "is_correct": is_correct,
            "time_spent_seconds": time_spent_seconds,
        }
        self.client.table("reading_answers").insert(payload).execute()
