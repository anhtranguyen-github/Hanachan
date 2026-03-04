import logging
import math
from datetime import datetime, timedelta
from typing import Optional, Tuple

from .models import KUStatus, Rating, SRSStage, SRSState

logger = logging.getLogger(__name__)


class FSRSEngine:
    DEFAULT_DIFFICULTY = 3.0
    BURNED_THRESHOLD_DAYS = 120
    REVIEW_THRESHOLD_DAYS = 3

    @classmethod
    def calculate_next_review(
        cls, current: SRSState, rating: Rating, wrong_count: int = 0
    ) -> Tuple[datetime, SRSState]:
        stage = current.stage
        stability = current.stability
        difficulty = current.difficulty
        reps = current.reps
        lapses = current.lapses

        # 1. FIF: Failure Intensity Framework
        # Intensity based on wrong count
        failure_intensity = min(math.log2(wrong_count + 1), 4.0)

        # Initialize defaults if missing
        if not difficulty:
            difficulty = cls.DEFAULT_DIFFICULTY
        if not stability:
            stability = 0.1
        if reps is None:
            reps = 0
        if lapses is None:
            lapses = 0

        # 2. State Transition Logic

        # CASE A: Hard Reset
        if rating == Rating.AGAIN:
            reps = 0
            lapses += 1
            stability = max(0.1, stability * 0.5)
            stage = SRSStage.LEARNING

        # CASE B: Struggle
        elif wrong_count > 0:
            reps += 1
            alpha = 0.2
            difficulty = min(5.0, difficulty + (alpha * failure_intensity))

            beta = 0.3
            decay = math.exp(-beta * failure_intensity)
            stability = max(0.1, stability * decay)

            if failure_intensity > 0.8:
                lapses += 1
                stage = SRSStage.LEARNING
                reps = max(1, math.floor(reps * 0.5))
            else:
                stage = SRSStage.REVIEW
                reps = reps  # unchanged

        # CASE C: Pure Success
        else:
            reps += 1
            factor = 1.65
            difficulty = max(1.3, difficulty - 0.1)

            # Guard: Initial stability steps
            if reps == 1 and stability < 0.166:
                stability = 0.166  # 4h
            elif reps == 2 and stability < 0.333:
                stability = 0.333  # 8h
            elif reps == 3 and stability < 1.0:
                stability = 1.0  # 1d
            elif reps == 4 and stability < 3.0:
                stability = 3.0  # 3d
            else:
                stability = stability * factor * (1.0 + (5.0 - difficulty) * 0.1)

            stability = max(stability, current.stability)

            if stability >= cls.BURNED_THRESHOLD_DAYS:
                stage = SRSStage.BURNED
            elif stability >= cls.REVIEW_THRESHOLD_DAYS:
                stage = SRSStage.REVIEW
            else:
                stage = SRSStage.LEARNING

        # 3. Final Scheduling
        interval_minutes = max(1, round(stability * 1440))
        next_review = datetime.utcnow() + timedelta(minutes=interval_minutes)

        next_state = SRSState(
            stage=stage,
            stability=round(stability, 4),
            difficulty=difficulty,
            reps=reps,
            lapses=lapses,
        )

        return next_review, next_state


class LearningService:
    def __init__(self, repo):
        self.repo = repo

    async def get_ku_progress(
        self, user_id: str, identifier: str, include_notes: bool = False
    ) -> Optional[KUStatus]:
        """
        Retrieves learning progress for a KU by ID, character, or slug.
        """
        # 1. Resolve identifier to KU ID if it's not a UUID
        ku = None
        if len(identifier) <= 4 or "-" not in identifier:
            kus = await self.repo.search_kus(identifier, limit=1)
            if kus:
                ku = kus[0]

        if not ku:
            ku_id = identifier
        else:
            ku_id = ku.id

        # 2. Get status for the 'meaning' facet by default
        return await self.repo.get_ku_status(user_id, ku_id, "meaning")

    async def search_knowledge(self, query: str, limit: int = 10):
        return await self.repo.search_kus(query, limit)

    async def submit_review(
        self, user_id: str, ku_id: str, facet: str, rating: Rating, wrong_count: int = 0
    ):
        # 1. Get current state
        status = await self.repo.get_ku_status(user_id, ku_id, facet)

        if not status:
            current_state = SRSState()
        else:
            current_state = SRSState(
                stage=status.state,
                stability=status.stability,
                difficulty=status.difficulty,
                reps=status.reps,
                lapses=status.lapses,
            )

        # 2. Calculate next
        next_review, next_state = FSRSEngine.calculate_next_review(
            current_state, rating, wrong_count
        )

        # 3. Update repo
        new_status = KUStatus(
            user_id=user_id,
            item_id=ku_id,
            facet=facet,
            state=next_state.stage,
            stability=next_state.stability,
            difficulty=next_state.difficulty,
            reps=next_state.reps,
            lapses=next_state.lapses,
            last_review=datetime.utcnow(),
            next_review=next_review,
        )

        await self.repo.upsert_ku_status(new_status)
        return new_status

    async def add_note(self, user_id: str, ku_id: str, note_content: str):
        return await self.repo.add_ku_note(user_id, ku_id, note_content)
