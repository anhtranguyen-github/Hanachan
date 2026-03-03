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


# FSRS-4.5 Default Parameters (19 weights)
# These are the default values from the FSRS-4.5 paper
# Users can customize these via user_fsrs_settings table
DEFAULT_W = [
    0.4,   # w0: Initial stability for rating 1 (Again)
    0.6,   # w1: Initial stability for rating 2 (Hard)
    2.2,   # w2: Initial stability for rating 3 (Good)
    10.9,  # w3: Initial stability for rating 4 (Easy)
    5.8,   # w4: Initial difficulty
    0.93,  # w5: Difficulty factor
    0.94,  # w6: Stability gain for Again
    0.86,  # w7: Stability gain for Hard
    1.01,  # w8: Stability gain for Good
    1.05,  # w9: Stability gain for Easy
    0.94,  # w10: Retrievability factor
    0.74,  # w11: Difficulty damping
    0.46,  # w12: Difficulty mean reversion
    0.27,  # w13: Short-term stability
    0.42,  # w14: Short-term stability exponent
    0.36,  # w15: Short-term difficulty
    0.29,  # w16: Short-term difficulty exponent
    1.2,   # w17: Initial stability for relearning
    0.25   # w18: Relearning stability factor
]


class FSRSSettings(BaseModel):
    """Per-user FSRS settings."""
    user_id: str
    # FSRS Weights w0-w18
    w: List[float] = DEFAULT_W.copy()
    # User preferences
    daily_new_cards: int = 10
    daily_review_limit: int = 100
    learning_steps: List[int] = [1, 10]  # Minutes
    relearning_steps: List[int] = [10]   # Minutes
    graduation_interval: int = 1  # Days
    easy_interval: int = 4        # Days
    interval_modifier: float = 1.0
    # Feature flags
    show_answer_timer: bool = True
    auto_play_audio: bool = False


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
        self._user_schedulers: Dict[str, FSRSScheduler] = {}
    
    def _get_user_scheduler(self, user_id: str) -> FSRSScheduler:
        """Get or create a scheduler with user's custom weights."""
        if user_id not in self._user_schedulers:
            settings = self.get_user_settings(user_id)
            self._user_schedulers[user_id] = FSRSScheduler(weights=settings.w)
        return self._user_schedulers[user_id]
    
    def get_user_settings(self, user_id: str) -> FSRSSettings:
        """Get FSRS settings for a user. Creates defaults if not exists."""
        query = """
            SELECT 
                user_id,
                ARRAY[w0, w1, w2, w3, w4, w5, w6, w7, w8, w9, w10, w11, w12, w13, w14, w15, w16, w17, w18] as w,
                daily_new_cards,
                daily_review_limit,
                learning_steps,
                relearning_steps,
                graduation_interval,
                easy_interval,
                interval_modifier,
                show_answer_timer,
                auto_play_audio
            FROM public.user_fsrs_settings
            WHERE user_id = %s
        """
        result = execute_single(query, (user_id,))
        
        if result:
            return FSRSSettings(
                user_id=str(result["user_id"]),
                w=result["w"],
                daily_new_cards=result["daily_new_cards"],
                daily_review_limit=result["daily_review_limit"],
                learning_steps=result["learning_steps"],
                relearning_steps=result["relearning_steps"],
                graduation_interval=result["graduation_interval"],
                easy_interval=result["easy_interval"],
                interval_modifier=result["interval_modifier"],
                show_answer_timer=result["show_answer_timer"],
                auto_play_audio=result["auto_play_audio"]
            )
        
        # Create default settings
        self._create_default_settings(user_id)
        return FSRSSettings(user_id=user_id)
    
    def _create_default_settings(self, user_id: str) -> None:
        """Create default FSRS settings for a user."""
        query = """
            INSERT INTO public.user_fsrs_settings (user_id)
            VALUES (%s)
            ON CONFLICT (user_id) DO NOTHING
        """
        execute_query(query, (user_id,), fetch=False)
    
    def update_user_settings(self, user_id: str, settings: Dict[str, Any]) -> FSRSSettings:
        """Update FSRS settings for a user."""
        # Build dynamic update query
        allowed_fields = {
            'w', 'daily_new_cards', 'daily_review_limit', 'learning_steps',
            'relearning_steps', 'graduation_interval', 'easy_interval',
            'interval_modifier', 'show_answer_timer', 'auto_play_audio'
        }
        
        updates = {k: v for k, v in settings.items() if k in allowed_fields}
        if not updates:
            return self.get_user_settings(user_id)
        
        # Handle weights array specially
        if 'w' in updates and isinstance(updates['w'], list):
            w = updates.pop('w')
            for i, val in enumerate(w[:19]):
                updates[f'w{i}'] = val
        
        fields = ', '.join([f"{k} = %s" for k in updates.keys()])
        values = list(updates.values()) + [user_id]
        
        query = f"""
            UPDATE public.user_fsrs_settings
            SET {fields}, updated_at = NOW()
            WHERE user_id = %s
            RETURNING *
        """  # noqa: S608
        execute_query(query, tuple(values), fetch=False)
        
        # Clear cached scheduler to pick up new weights
        if user_id in self._user_schedulers:
            del self._user_schedulers[user_id]
        
        return self.get_user_settings(user_id)
    
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
            "by_state": {"new": 0, "learning": 0, "review": 0, "relearning": 0, "burned": 0},
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
        # Get user's scheduler with custom weights
        scheduler = self._get_user_scheduler(user_id)
        
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
        
        # Calculate new schedule using user's custom scheduler
        result = scheduler.schedule_review(state, rating)
        
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
