from typing import Optional
from uuid import UUID

from supabase import Client

from ...domain.reading.models import ReadingExercise, ReadingQuestion, ReadingSession
from ...ports.repositories import IReadingRepository


class SupabaseReadingRepository(IReadingRepository):
    def __init__(self, client: Client):
        self.client = client

    async def get_session(self, session_id: UUID) -> Optional[ReadingSession]:
        response = (
            self.client.table("reading_sessions").select("*").eq("id", str(session_id)).execute()
        )
        if not response.data:
            return None
        data = response.data[0]
        return ReadingSession(
            id=data["id"],
            user_id=data["user_id"],
            status=data["status"],
            started_at=data.get("started_at"),
            completed_at=data.get("completed_at"),
        )

    async def get_exercise(self, exercise_id: UUID) -> Optional[ReadingExercise]:
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
        # Note: In a real system, we'd have a 'user_answers' table
        # Mutating database ONLY happens here in the domain service's adapter
        payload = {
            "user_id": user_id,
            "exercise_id": str(exercise_id),
            "question_index": question_index,
            "user_answer": user_answer,
            "is_correct": is_correct,
            "time_spent_seconds": time_spent_seconds,
        }
        self.client.table("reading_answers").insert(payload).execute()
