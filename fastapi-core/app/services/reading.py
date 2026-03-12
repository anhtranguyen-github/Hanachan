from app.core.exceptions import NotFoundError, UnauthorizedError, ValidationError
from app.models.reading import AnswerResult, AnswerSubmission
from app.repositories.reading import IReadingRepository

class ReadingService:
    def __init__(self, repo: IReadingRepository):
        self.repo = repo

    async def submit_answer(self, user_id: str, submission: AnswerSubmission) -> AnswerResult:
        # 1. Fetch exercise and session
        exercise = await self.repo.get_exercise(submission.exercise_id)
        if not exercise:
            raise NotFoundError("Exercise not found")

        session = await self.repo.get_session(exercise.session_id)
        if not session:
            raise NotFoundError("Session not found")

        # 2. Authorization check
        if session.user_id != user_id:
            raise UnauthorizedError("User does not own this reading session")

        # 3. Validation check
        if session.status != "active":
            raise ValidationError(f"Cannot submit answer to a session in '{session.status}' state")

        if submission.question_index >= len(exercise.questions):
            raise ValidationError("Question index out of bounds")

        # 4. Core Logic: Correctness check
        question = exercise.questions[submission.question_index]
        is_correct = (
            submission.user_answer.strip().lower() == question.correct_answer.strip().lower()
        )

        # 5. Persistence
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
            session_completed=False,  # Logic for completion could be added here
        )
