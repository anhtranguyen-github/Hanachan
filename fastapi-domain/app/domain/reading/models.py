from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class ReadingQuestion(BaseModel):
    id: str  # Usually just an index or semi-slug in exercises
    text: str
    correct_answer: str
    explanation: Optional[str] = None

class ReadingExercise(BaseModel):
    id: UUID
    session_id: UUID
    questions: List[ReadingQuestion]
    order_index: int

class ReadingSession(BaseModel):
    id: UUID
    user_id: str
    status: str
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class AnswerSubmission(BaseModel):
    exercise_id: UUID
    question_index: int
    user_answer: str
    time_spent_seconds: int = 0

class AnswerResult(BaseModel):
    is_correct: bool
    correct_answer: str
    explanation: Optional[str] = None
    session_completed: bool = False
