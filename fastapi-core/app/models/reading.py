from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

class ReadingQuestion(BaseModel):
    id: str
    text: str
    correct_answer: str
    explanation: str | None = None

class ReadingExercise(BaseModel):
    id: UUID
    session_id: UUID
    questions: list[ReadingQuestion]
    order_index: int

class ReadingSession(BaseModel):
    id: UUID
    user_id: str
    status: str
    started_at: datetime | None = None
    completed_at: datetime | None = None

class AnswerSubmission(BaseModel):
    exercise_id: UUID
    question_index: int
    user_answer: str
    time_spent_seconds: int = 0

class AnswerResult(BaseModel):
    is_correct: bool
    correct_answer: str
    explanation: str | None = None
    session_completed: bool = False
