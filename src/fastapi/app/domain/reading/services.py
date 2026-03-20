from app.domain.reading.errors import (
    QuestionNotFoundError,
    ReadingCoreError,
    SessionNotFoundError,
)
from app.domain.reading.models import AnswerResult, AnswerSubmission
from app.domain.reading.policies import ReadingPolicy
from app.repositories.reading import IReadingRepository


class ReadingService:
    def __init__(self, repo: IReadingRepository):
        self.repo = repo

    async def submit_answer(self, user_id: str, submission: AnswerSubmission) -> AnswerResult:
        exercise = await self.repo.get_exercise(submission.exercise_id)
        if not exercise:
            raise ReadingCoreError("Exercise not found")

        session = await self.repo.get_session(exercise.session_id)
        if not session:
            raise SessionNotFoundError("Session not found")

        ReadingPolicy.ensure_can_submit_answer(session, user_id)

        if submission.question_index >= len(exercise.questions):
            raise QuestionNotFoundError("Question index out of bounds")

        question = exercise.questions[submission.question_index]
        is_correct = submission.user_answer.strip().lower() == question.correct_answer.strip().lower()

        await self.repo.record_answer(
            user_id=user_id,
            exercise_id=submission.exercise_id,
            question_index=submission.question_index,
            user_answer=submission.user_answer,
            is_correct=is_correct,
            time_spent_seconds=submission.time_spent_seconds,
        )

        return AnswerResult(
            is_correct=is_correct,
            correct_answer=question.correct_answer,
            explanation=question.explanation,
            session_completed=False,
        )
