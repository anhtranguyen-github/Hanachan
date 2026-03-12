import math
import logging
from datetime import datetime, timedelta
from app.core.exceptions import NotFoundError
from app.models.learning import KUStatus, Rating, SRSStage, SRSState
from app.repositories.learning import ILearningRepository

logger = logging.getLogger(__name__)

class FSRSEngine:
    DEFAULT_DIFFICULTY = 3.0
    BURNED_THRESHOLD_DAYS = 120
    REVIEW_THRESHOLD_DAYS = 3

    @classmethod
    def calculate_next_review(
        cls, current: SRSState, rating: Rating, wrong_count: int = 0
    ) -> tuple[datetime, SRSState]:
        stage = current.stage
        stability = current.stability
        difficulty = current.difficulty
        reps = current.reps
        lapses = current.lapses

        # 1. FIF: Failure Intensity Framework
        failure_intensity = min(math.log2(wrong_count + 1), 4.0)

        # Initialize defaults
        if not difficulty: difficulty = cls.DEFAULT_DIFFICULTY
        if not stability: stability = 0.1
        if reps is None: reps = 0
        if lapses is None: lapses = 0

        # 2. State Transition Logic
        if rating == Rating.AGAIN:
            reps = 0
            lapses += 1
            stability = max(0.1, stability * 0.5)
            stage = SRSStage.LEARNING
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
        else:
            reps += 1
            factor = 1.65
            difficulty = max(1.3, difficulty - 0.1)
            if reps == 1 and stability < 0.166: stability = 0.166
            elif reps == 2 and stability < 0.333: stability = 0.333
            elif reps == 3 and stability < 1.0: stability = 1.0
            elif reps == 4 and stability < 3.0: stability = 3.0
            else: stability = stability * factor * (1.0 + (5.0 - difficulty) * 0.1)
            stability = max(stability, current.stability)
            if stability >= cls.BURNED_THRESHOLD_DAYS: stage = SRSStage.BURNED
            elif stability >= cls.REVIEW_THRESHOLD_DAYS: stage = SRSStage.REVIEW
            else: stage = SRSStage.LEARNING

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

import asyncio
from app.models.learning import DashboardStats, TypeMastery, Forecast, ForecastItem, DailyForecastItem

class LearningService:
    def __init__(self, repo: ILearningRepository):
        self.repo = repo

    async def get_dashboard_stats(self, user_id: str) -> DashboardStats:
        # 1. Fetch data in parallel
        states, logs, forecast_raw, total_kus = await asyncio.gather(
            self.repo.get_all_user_states(user_id),
            self.repo.get_review_logs(user_id),
            self.repo.get_review_forecast(user_id),
            self.repo.get_total_ku_count()
        )

        # 2. Process States
        unit_groups = {}
        srs_spread = {"apprentice": 0, "guru": 0, "master": 0, "enlightened": 0, "burned": 0}
        level_set = set()
        due_items_count = 0
        due_breakdown = {"learning": 0, "review": 0}
        now = datetime.utcnow()

        for s in states:
            ku_id = s["item_id"]
            state = s["state"]
            stab = s["stability"] or 0
            ku = s.get("knowledge_units") or {}
            ku_type = ku.get("type", "unknown")
            if ku_type == "vocab": ku_type = "vocabulary"
            level = ku.get("level")
            if level: level_set.add(level)

            if ku_id not in unit_groups:
                unit_groups[ku_id] = {"total": 0, "mastered": 0, "burned": 0, "type": ku_type}
            
            unit_groups[ku_id]["total"] += 1
            if state == "burned": 
                unit_groups[ku_id]["burned"] += 1
                srs_spread["burned"] += 1
            elif state == "review": 
                unit_groups[ku_id]["mastered"] += 1
            
            if state != "burned":
                if stab >= 30.0: srs_spread["enlightened"] += 1
                elif stab >= 14.0: srs_spread["master"] += 1
                elif stab >= 3.0: srs_spread["guru"] += 1
                else: srs_spread["apprentice"] += 1

            # Check if due
            next_review_str = s.get("next_review")
            if next_review_str and state != "burned":
                next_review = datetime.fromisoformat(next_review_str.replace("Z", "+00:00"))
                if next_review <= now:
                    due_items_count += 1
                    if state == "learning": due_breakdown["learning"] += 1
                    else: due_breakdown["review"] += 1

        unique_kus = unit_groups.values()
        total_learned = len(unit_groups)
        total_mastered = len([g for g in unique_kus if (g["mastered"] + g["burned"]) > 0 and (g["mastered"] + g["burned"]) == g["total"]])
        total_burned = len([g for g in unique_kus if g["burned"] > 0 and g["burned"] == g["total"]])

        # Type Mastery
        type_mastery_counts = {"radical": 0, "kanji": 0, "vocabulary": 0, "grammar": 0}
        for g in unique_kus:
            if g["type"] in type_mastery_counts and (g["mastered"] + g["burned"]) == g["total"] and g["total"] > 0:
                type_mastery_counts[g["type"]] += 1
        
        type_mastery_pct = TypeMastery(
            radical=round((type_mastery_counts["radical"] / max(total_learned, 1)) * 100),
            kanji=round((type_mastery_counts["kanji"] / max(total_learned, 1)) * 100),
            vocabulary=round((type_mastery_counts["vocabulary"] / max(total_learned, 1)) * 100),
            grammar=round((type_mastery_counts["grammar"] / max(total_learned, 1)) * 100),
        )

        # 3. Process Logs (Heatmap, Retention, Streak)
        heatmap = {}
        last_7_days = [0] * 7
        today_str = now.date().isoformat()
        today_reviews = 0
        correct_today = 0

        for log in logs:
            dt = datetime.fromisoformat(log["reviewed_at"].replace("Z", "+00:00"))
            date_key = dt.date().isoformat()
            heatmap[date_key] = heatmap.get(date_key, 0) + 1
            
            diff_days = (now.date() - dt.date()).days
            if 0 <= diff_days < 7:
                last_7_days[6 - diff_days] += 1
            
            if date_key == today_str:
                today_reviews += 1
                # In current schema, rating > 1 is correct (1=again, 3=pass)
                # Wait, what's in the log? Let's assume rating field exists.
                if log.get("rating", 3) > 1:
                    correct_today += 1

        retention = round((correct_today / max(today_reviews, 1)) * 100) if today_reviews > 0 else 100
        streak = self._calculate_streak(heatmap, now.date())

        # 4. Process Forecast
        hourly_f = []
        for i in range(24):
            h_start = now + timedelta(hours=i)
            h_end = h_start + timedelta(hours=1)
            count = len([f for f in forecast_raw if h_start <= datetime.fromisoformat(f["next_review"].replace("Z", "+00:00")) < h_end])
            hourly_f.append(ForecastItem(time=h_start.isoformat(), count=count))

        daily_f = []
        for i in range(14):
            d_start = (now + timedelta(days=i)).date()
            count = len([f for f in forecast_raw if datetime.fromisoformat(f["next_review"].replace("Z", "+00:00")).date() == d_start])
            daily_f.append(DailyForecastItem(date=d_start.isoformat(), count=count))

        return DashboardStats(
            reviewsDue=due_items_count,
            dueBreakdown=due_breakdown,
            totalLearned=total_learned,
            totalMastered=total_mastered,
            totalBurned=total_burned,
            recentLevels=sorted(list(level_set)),
            retention=retention,
            minutesSpent=round(today_reviews * 0.5),
            reviewsToday=today_reviews,
            actionFrequencies={"analyze": 0, "flashcard": total_learned, "srs": 0},
            dailyReviews=last_7_days,
            forecast=Forecast(hourly=hourly_f, daily=daily_f, total=len(forecast_raw)),
            heatmap=heatmap,
            typeMastery=type_mastery_pct,
            srsSpread=srs_spread,
            totalKUCoverage=round((total_learned / max(total_kus, 1)) * 100, 2),
            streak=streak
        )

    def _calculate_streak(self, heatmap: dict, today: datetime.date) -> int:
        streak = 0
        curr = today
        yesterday = today - timedelta(days=1)
        
        if today.isoformat() not in heatmap and yesterday.isoformat() not in heatmap:
            return 0
            
        curr = today if today.isoformat() in heatmap else yesterday
        while curr.isoformat() in heatmap:
            streak += 1
            curr -= timedelta(days=1)
        return streak

    async def get_ku_progress(self, user_id: str, identifier: str) -> KUStatus | None:
        ku = None
        if len(identifier) <= 4 or "-" not in identifier:
            kus = await self.repo.search_kus(identifier, limit=1)
            if kus: ku = kus[0]
        ku_id = ku.id if ku else identifier
        return await self.repo.get_ku_status(user_id, ku_id, "meaning")

    async def search_knowledge(self, query: str, limit: int = 10):
        return await self.repo.search_kus(query, limit)

    async def submit_review(
        self, user_id: str, ku_id: str, facet: str, rating: Rating, wrong_count: int = 0
    ):
        status = await self.repo.get_ku_status(user_id, ku_id, facet)
        current_state = SRSState(
            stage=status.state,
            stability=status.stability,
            difficulty=status.difficulty,
            reps=status.reps,
            lapses=status.lapses,
        ) if status else SRSState()

        next_review, next_state = FSRSEngine.calculate_next_review(current_state, rating, wrong_count)
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
