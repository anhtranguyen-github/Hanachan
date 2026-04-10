"""
SRS Engine — FSRS-4.5 scheduling + WaniKani stage mapping.

Supports:
- Standard FSRS calculations (kept from the existing FSRSEngine)
- WaniKani stage transitions (0-9)
- Custom deck interval multipliers
"""

from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone

from app.domain.srs.models import CustomDeckConfig, ReviewResult, SRSStage, SRSState

# Default FSRS-4.5 weights
DEFAULT_WEIGHTS = [
    0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 1.01,
    1.05, 0.94, 0.74, 0.46, 0.27, 0.29, 0.42, 0.36,
    0.29, 1.2, 0.25,
]

# WaniKani stage → base interval (hours)
STAGE_INTERVALS: dict[int, int | None] = {
    0: None,     # Initiate — unlocked, not started
    1: 4,        # Apprentice I — 4h
    2: 8,        # Apprentice II — 8h
    3: 24,       # Apprentice III — 1d
    4: 48,       # Apprentice IV — 2d
    5: 168,      # Guru I — 1w
    6: 336,      # Guru II — 2w
    7: 720,      # Master — 30d
    8: 2880,     # Enlightened — 120d
    9: None,     # Burned — done
}


class SRSEngine:
    """SRS Engine combining FSRS-4.5 with WaniKani stage mapping."""

    @classmethod
    def calculate_review(
        cls,
        current: SRSState,
        rating: int,  # 1=Again, 2=Hard, 3=Good, 4=Easy
        weights: list[float] | None = None,
        wrong_count: int = 0,
        deck_config: CustomDeckConfig | None = None,
    ) -> ReviewResult:
        """
        Calculate next review state.

        Combines FSRS-4.5 for stability/difficulty with WaniKani stage mapping.
        """
        w = weights or DEFAULT_WEIGHTS
        multiplier = deck_config.interval_multiplier if deck_config else 1.0

        # FSRS calculation
        if current.stage == 0 or current.reps == 0:
            # First review (new item)
            stability = max(0.1, w[rating - 1])
            difficulty = max(1.0, min(10.0, w[4] - math.exp(w[5] * (rating - 1)) + 1))
            reps = 1 if rating > 1 else 0
            lapses = 0
        else:
            difficulty = max(1.0, min(10.0, current.difficulty - w[6] * (rating - 3)))

            if rating == 1:
                # Failed — lapse
                stability = max(
                    0.1,
                    w[11] * (difficulty ** -w[12])
                    * ((current.stability + 1) ** w[13] - 1)
                    * math.exp((1 - 1) * w[14]),
                )
                reps = max(0, current.reps - 2)
                lapses = current.lapses + 1
            else:
                retrievability = 0.9
                hard_penalty = w[15] if rating == 2 else 1.0
                easy_bonus = w[16] if rating == 4 else 1.0

                next_s = current.stability * (
                    1
                    + math.exp(w[8])
                    * (11 - difficulty)
                    * (current.stability ** -w[9])
                    * (math.exp((1 - retrievability) * w[10]) - 1)
                    * hard_penalty
                    * easy_bonus
                )
                stability = max(0.1, next_s)
                reps = current.reps + 1
                lapses = current.lapses

        # Apply wrong_count penalty
        if wrong_count > 0 and rating > 1:
            failure_intensity = min(math.log2(wrong_count + 1), 4.0)
            difficulty = round(min(10.0, difficulty + (0.2 * failure_intensity)), 4)
            stability = round(max(0.1, stability * math.exp(-0.3 * failure_intensity)), 4)
            if failure_intensity > 0.8:
                lapses += 1
                reps = max(1, reps // 2)

        # Calculate new WaniKani stage
        new_stage = cls._calculate_new_stage(current.stage, rating)

        # Calculate interval based on stage
        base_hours = STAGE_INTERVALS.get(new_stage)
        if base_hours is None:
            # Stage 0 or 9 — no interval
            interval_hours = 0
        else:
            interval_hours = base_hours * multiplier

        # Use FSRS stability as a floor (if FSRS says longer, use it)
        fsrs_hours = stability * 24
        effective_hours = max(interval_hours, fsrs_hours * multiplier) if interval_hours > 0 else fsrs_hours * multiplier

        # Ensure minimum interval
        effective_hours = max(0.167, effective_hours)  # at least 10 mins

        now = datetime.now(timezone.utc)
        next_review = now + timedelta(hours=effective_hours)
        interval_seconds = int(effective_hours * 3600)

        return ReviewResult(
            new_stage=new_stage,
            new_stability=round(stability, 4),
            new_difficulty=round(difficulty, 4),
            new_reps=reps,
            new_lapses=lapses,
            next_review_at=next_review,
            interval_seconds=interval_seconds,
        )

    @staticmethod
    def _calculate_new_stage(current_stage: int, rating: int) -> int:
        """WaniKani-style stage transition logic."""
        if rating == 1:  # Again/Wrong
            # Drop stages based on current position
            if current_stage <= 2:
                return 1  # Stay in early apprentice
            elif current_stage <= 4:
                return max(1, current_stage - 2)  # Drop 2 stages
            else:
                return max(1, current_stage - 2)  # Drop but never below 1
        elif rating == 2:  # Hard
            # Stay at current stage (no advance)
            return current_stage
        elif rating == 3:  # Good
            # Advance 1 stage (normal)
            return min(9, current_stage + 1)
        else:  # Easy (4)
            # Advance 2 stages (fast track)
            return min(9, current_stage + 2)
