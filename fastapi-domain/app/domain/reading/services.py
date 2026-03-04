from uuid import UUID
from .models import AnswerResult, AnswerSubmission
from .policies import ReadingPolicy
from .errors import SessionNotFoundError, QuestionNotFoundError, ReadingDomainError
from ...ports.repositories import IReadingRepository

class ReadingService:
    def __init__(self, repo: IReadingRepository):
        self.repo = repo

    async def submit_answer(
        self, 
        user_id: str, 
        submission: AnswerSubmission
    ) -> AnswerResult:
        # 1. Fetch exercise and session
        exercise = await self.repo.get_exercise(submission.exercise_id)
        if not exercise:
            raise ReadingDomainError("Exercise not found")
            
        session = await self.repo.get_session(exercise.session_id)
        if not session:
            raise SessionNotFoundError("Session not found")

        # 2. Enforce Business Policies (Ownership, State)
        ReadingPolicy.ensure_can_submit_answer(session, user_id)

        # 3. Domain Logic: Correctness check
        if submission.question_index >= len(exercise.questions):
            raise QuestionNotFoundError("Question index out of bounds")
            
        question = exercise.questions[submission.question_index]
        is_correct = (
            submission.user_answer.strip().lower() == 
            question.correct_answer.strip().lower()
        )

        # 4. Persistence via Port
        await self.repo.record_answer(
            user_id=user_id,
            exercise_id=submission.exercise_id,
            question_index=submission.question_index,
            user_answer=submission.user_answer,
            is_correct=is_correct,
            time_spent_seconds=submission.time_spent_seconds
        )

        return AnswerResult(
            is_correct=is_correct,
            correct_answer=question.correct_answer,
            explanation=question.explanation,
            session_completed=False  # Logic for completion could be added here
        )
