"""
FSRS (Free Spaced Repetition Scheduler) Service
Implements the FSRS-4.5 algorithm for optimal review scheduling.
Based on the FSRS algorithm by Open Spaced Repetition.
"""

from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from pydantic import BaseModel

from ..core.database import execute_query, execute_single


# FSRS-4.5 Parameters (default weights)
# These can be tuned based on user performance data
DEFAULT_W = [
    0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01,
    1.49, 0.14, 0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61
]


class FSRSState(BaseModel):
    """Represents the FSRS state for a learning item."""
    user_id: str
    item_id: str  # Can be ku_id, sentence_id, or video_id
    item_type: str  # 'ku', 'sentence', 'video'
    facet: str = "meaning"  # For KU: meaning, reading, cloze
    state: str = "new"  # new, learning, review, relearning
    stability: float = 0.0  # S in days - how long memory lasts
    difficulty: float = 0.0  # D (0-10 scale after transformation)
    reps: int = 0  # Number of successful reviews
    lapses: int = 0  # Number of times forgotten
    last_review: Optional[datetime] = None
    next_review: Optional[datetime] = None


class FSRSSchedule(BaseModel):
    """Schedule result for a review."""
    item_id: str
    item_type: str
    due_date: datetime
    interval_days: float
    priority_score: float  # Higher = more urgent
    is_new: bool


class FSRSReviewResult(BaseModel):
    """Result of a review with updated state."""
    state: str
    stability: float
    difficulty: float
    reps: int
    lapses: int
    next_review: datetime
    interval_days: float


class FSRSScheduler:
    """
    FSRS-4.5 Scheduler implementation.
    
    The algorithm uses the following key concepts:
    - Stability (S): How long a memory lasts (in days)
    - Difficulty (D): How hard an item is to remember (0-10)
    - Retrievability (R): Probability of recall at time t
    """
    
    def __init__(self, weights: Optional[List[float]] = None):
        self.w = weights or DEFAULT_W.copy()
    
    def _init_difficulty(self, rating: int) -> float:
        """Initialize difficulty based on first rating (1-4)."""
        # w[4] is initial difficulty
        return self.w[4] - math.exp(self.w[5] * (rating - 1)) + 1
    
    def _init_stability(self, rating: int) -> float:
        """Initialize stability based on first rating (1-4)."""
        # w[0-3] are initial stabilities for ratings 1-4
        return max(0.1, self.w[rating - 1])
    
    def _next_difficulty(self, difficulty: float, rating: int) -> float:
        """Calculate next difficulty after a review."""
        # w[6] is difficulty decay
        next_d = difficulty - self.w[6] * (rating - 3)
        # Clamp between 1 and 10
        return max(1.0, min(10.0, next_d))
    
    def _next_stability(
        self, 
        stability: float, 
        difficulty: float, 
        rating: int,
        state: str
    ) -> float:
        """Calculate next stability after a review."""
        if rating == 1:  # Again (failed)
            # w[11] is failure stability factor
            return max(
                0.1,
                self.w[11]
                * math.pow(difficulty, -self.w[12])
                * (math.pow(stability + 1, self.w[13]) - 1)
                * math.exp((1 - rating) * self.w[14]),
            )
        else:
            # Success path
            if state == "new":
                return self._init_stability(rating)
            
            # w[7-10] are stability factors for successful reviews
            hard_penalty = 1.0 if rating == 4 else self.w[15]
            easy_bonus = 1.0 if rating == 2 else self.w[16]
            
            retrievability = math.exp(math.log(0.9) * 1.0)  # Simplified
            
            next_s = stability * (
                1
                + math.exp(self.w[8])
                * (11 - difficulty)
                * math.pow(stability, -self.w[9])
                * (math.exp((1 - retrievability) * self.w[10]) - 1)
                * hard_penalty
                * easy_bonus
            )
            return max(0.1, next_s)
    
    def schedule_review(
        self, 
        current_state: FSRSState,
        rating: int  # 1=Again, 2=Hard, 3=Good, 4=Easy
    ) -> FSRSReviewResult:
        """
        Schedule the next review based on current state and user rating.
        
        Args:
            current_state: Current FSRS state
            rating: User's self-assessment (1-4)
        
        Returns:
            Updated FSRS state with next review scheduled
        """
        now = datetime.now(timezone.utc)
        
        if current_state.state == "new":
            # First review
            stability = self._init_stability(rating)
            difficulty = self._init_difficulty(rating)
            reps = 1 if rating > 1 else 0
            lapses = 0
            state = "learning" if rating < 4 else "review"
        else:
            # Subsequent review
            stability = self._next_stability(
                current_state.stability,
                current_state.difficulty,
                rating,
                current_state.state
            )
            difficulty = self._next_difficulty(current_state.difficulty, rating)
            
            if rating == 1:
                # Failed - reset reps and increment lapses
                reps = max(0, current_state.reps - 2)
                lapses = current_state.lapses + 1
                state = "relearning"
            else:
                # Success
                reps = current_state.reps + 1
                lapses = current_state.lapses
                state = "review" if reps >= 2 else "learning"
        
        # Calculate next review date
        interval_days = stability
        next_review = now + timedelta(days=interval_days)
        
        return FSRSReviewResult(
            state=state,
            stability=stability,
            difficulty=difficulty,
            reps=reps,
            lapses=lapses,
            next_review=next_review,
            interval_days=interval_days
        )
    
    def get_retrievability(self, stability: float, days_since_review: float) -> float:
        """
        Calculate the probability of recalling an item.
        
        R = exp(ln(0.9) * t / S)
        Where t = days since last review, S = stability
        """
        if stability <= 0 or days_since_review < 0:
            return 1.0
        return math.exp(math.log(0.9) * days_since_review / stability)


class FSRSService:
    """Service for managing FSRS-based learning and reviews."""
    
    def __init__(self):
        self.scheduler = FSRSScheduler()
    
    def get_due_items(
        self, 
        user_id: str, 
        item_type: Optional[str] = None,
        limit: int = 20
    ) -> List[FSRSSchedule]:
        """Get items due for review for a user."""
        query = """
            SELECT 
                user_id,
                item_id,
                item_type,
                facet,
                state,
                stability,
                difficulty,
                reps,
                lapses,
                last_review,
                next_review
            FROM public.user_fsrs_states
            WHERE user_id = %s 
            AND next_review <= NOW() + INTERVAL '1 day'
        """
        params = [user_id]
        
        if item_type:
            query += " AND item_type = %s"
            params.append(item_type)
        
        query += " ORDER BY next_review ASC LIMIT %s"
        params.append(limit)
        
        results = execute_query(query, tuple(params))
        
        schedules = []
        now = datetime.now(timezone.utc)
        
        for row in results:
            next_review = row["next_review"]
            if next_review.tzinfo is None:
                next_review = next_review.replace(tzinfo=timezone.utc)
            
            # Calculate priority score based on lateness
            days_overdue = max(0, (now - next_review).total_seconds() / 86400)
            priority_score = days_overdue + (1.0 / max(1, row["stability"]))
            
            schedules.append(FSRSSchedule(
                item_id=row["item_id"],
                item_type=row["item_type"],
                due_date=next_review,
                interval_days=row["stability"],
                priority_score=priority_score,
                is_new=(row["state"] == "new")
            ))
        
        return schedules
    
    def get_learning_summary(self, user_id: str) -> Dict[str, Any]:
        """Get summary of user's learning state."""
        query = """
            SELECT 
                item_type,
                state,
                COUNT(*) as count,
                AVG(stability) as avg_stability,
                AVG(difficulty) as avg_difficulty
            FROM public.user_fsrs_states
            WHERE user_id = %s
            GROUP BY item_type, state
        """
        results = execute_query(query, (user_id,))
        
        summary = {
            "by_type": {},
            "by_state": {"new": 0, "learning": 0, "review": 0, "relearning": 0},
            "total": 0,
            "due_today": 0
        }
        
        for row in results:
            item_type = row["item_type"]
            state = row["state"]
            count = row["count"]
            
            if item_type not in summary["by_type"]:
                summary["by_type"][item_type] = {"total": 0, "states": {}}
            
            summary["by_type"][item_type]["total"] += count
            summary["by_type"][item_type]["states"][state] = count
            summary["by_state"][state] += count
            summary["total"] += count
        
        # Count due today
        due_query = """
            SELECT COUNT(*) as due_count
            FROM public.user_fsrs_states
            WHERE user_id = %s AND next_review <= NOW() + INTERVAL '1 day'
        """
        due_result = execute_single(due_query, (user_id,))
        summary["due_today"] = due_result["due_count"] if due_result else 0
        
        return summary
    
    def submit_review(
        self,
        user_id: str,
        item_id: str,
        item_type: str,
        rating: int,
        facet: str = "meaning"
    ) -> FSRSReviewResult:
        """Submit a review and update the schedule."""
        # Get current state
        current = execute_single(
            """SELECT * FROM public.user_fsrs_states 
               WHERE user_id = %s AND item_id = %s AND item_type = %s AND facet = %s""",
            (user_id, item_id, item_type, facet)
        )
        
        if current:
            state = FSRSState(
                user_id=user_id,
                item_id=item_id,
                item_type=item_type,
                facet=facet,
                state=current["state"],
                stability=current["stability"],
                difficulty=current["difficulty"],
                reps=current["reps"],
                lapses=current["lapses"],
                last_review=current["last_review"],
                next_review=current["next_review"]
            )
        else:
            # New item
            state = FSRSState(
                user_id=user_id,
                item_id=item_id,
                item_type=item_type,
                facet=facet,
                state="new",
                stability=0,
                difficulty=5.0,
                reps=0,
                lapses=0
            )
        
        # Calculate new schedule
        result = self.scheduler.schedule_review(state, rating)
        
        # Save to database
        now = datetime.now(timezone.utc)
        execute_query(
            """
            INSERT INTO public.user_fsrs_states 
                (user_id, item_id, item_type, facet, state, stability, difficulty, 
                 reps, lapses, last_review, next_review, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id, item_id, item_type, facet) DO UPDATE SET
                state = EXCLUDED.state,
                stability = EXCLUDED.stability,
                difficulty = EXCLUDED.difficulty,
                reps = EXCLUDED.reps,
                lapses = EXCLUDED.lapses,
                last_review = EXCLUDED.last_review,
                next_review = EXCLUDED.next_review,
                updated_at = EXCLUDED.updated_at
            """,
            (user_id, item_id, item_type, facet, result.state, result.stability,
             result.difficulty, result.reps, result.lapses, now, result.next_review,
             now, now),
            fetch=False
        )
        
        # Log the review
        execute_query(
            """
            INSERT INTO public.fsrs_review_logs
                (user_id, item_id, item_type, facet, rating, state, stability, 
                 difficulty, interval_days, reviewed_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (user_id, item_id, item_type, facet, rating, result.state,
             result.stability, result.difficulty, result.interval_days, now),
            fetch=False
        )
        
        return result
    
    def should_teach_or_review(self, user_id: str) -> Tuple[str, Dict[str, Any]]:
        """
        Decide whether the user should learn new content or review existing items.
        
        Returns:
            Tuple of (action, details) where action is 'teach', 'review', or 'mixed'
        """
        summary = self.get_learning_summary(user_id)
        due_count = summary["due_today"]
        review_count = summary["by_state"].get("review", 0)
        learning_count = summary["by_state"].get("learning", 0)
        # new_count removed - was unused
        
        # If many items are due, prioritize review
        if due_count >= 10:
            return ("review", {
                "reason": "Many items due for review",
                "due_count": due_count,
                "suggested_reviews": min(due_count, 20)
            })
        
        # If user has items in learning state, continue with mixed approach
        if learning_count > 0:
            return ("mixed", {
                "reason": "Active learning in progress",
                "learning_count": learning_count,
                "due_count": due_count,
                "suggested_new": 3
            })
        
        # If user has few items in review, teach new content
        if review_count < 20:
            return ("teach", {
                "reason": "Building initial knowledge base",
                "review_count": review_count,
                "suggested_new": min(5, 20 - review_count)
            })
        
        # Default to review-heavy mix
        return ("mixed", {
            "reason": "Maintaining knowledge",
            "review_count": review_count,
            "due_count": due_count,
            "suggested_reviews": min(due_count, 15),
            "suggested_new": 2
        })


# Singleton instance
_fsrs_service: Optional[FSRSService] = None


def get_fsrs_service() -> FSRSService:
    """Get the singleton FSRS service instance."""
    global _fsrs_service
    if _fsrs_service is None:
        _fsrs_service = FSRSService()
    return _fsrs_service
