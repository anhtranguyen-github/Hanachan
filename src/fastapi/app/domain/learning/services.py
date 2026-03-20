import asyncio
import logging
import math
from datetime import date, datetime, timedelta, timezone

from app.domain.learning.models import (
    DashboardStats,
    DailyForecastItem,
    Forecast,
    ForecastItem,
    KUStatus,
    Rating,
    SRSStage,
    SRSState,
    TypeMastery,
)
from app.repositories.learning import ILearningRepository

logger = logging.getLogger(__name__)


class FSRSEngine:
    @classmethod
    def calculate_next_review(
        cls, current: SRSState, rating: int, w: list[float]
    ) -> tuple[datetime, SRSState]:
        """Implements FSRS-4.5 scheduling logic."""
        if current.stage == SRSStage.NEW:
            stability = max(0.1, w[rating - 1])
            difficulty = max(1.0, min(10.0, w[4] - math.exp(w[5] * (rating - 1)) + 1))
            reps = 1 if rating > 1 else 0
            lapses = 0
            stage = SRSStage.REVIEW if rating == 4 else SRSStage.LEARNING
        else:
            difficulty = max(1.0, min(10.0, current.difficulty - w[6] * (rating - 3)))

            if rating == 1:
                stability = max(
                    0.1,
                    w[11]
                    * (difficulty ** -w[12])
                    * ((current.stability + 1) ** w[13] - 1)
                    * math.exp((1 - 1) * w[14]),
                )
                reps = max(0, current.reps - 2)
                lapses = current.lapses + 1
                stage = SRSStage.RELEARNING
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
                stage = SRSStage.REVIEW if reps >= 2 else SRSStage.LEARNING

        next_review = datetime.now(timezone.utc) + timedelta(days=stability)
        if next_review <= datetime.now(timezone.utc):
            next_review = datetime.now(timezone.utc) + timedelta(minutes=10)

        next_state = SRSState(
            stage=stage,
            stability=round(stability, 4),
            difficulty=round(difficulty, 4),
            reps=reps,
            lapses=lapses,
        )
        return next_review, next_state


class LearningService:
    def __init__(self, repo: ILearningRepository):
        self.repo = repo

    async def get_dashboard_stats(self, user_id: str, deck_id: str | None = None) -> DashboardStats:
        tasks: list = [
            self.repo.get_all_user_states(user_id),
            self.repo.get_review_logs(user_id),
            self.repo.get_total_ku_count(),
        ]

        if deck_id:
            tasks.append(self.repo.get_deck_items(deck_id))
            states_raw, logs, total_kus, deck_item_ids = await asyncio.gather(*tasks)
            filter_item_ids = set(deck_item_ids)
            states = [s for s in states_raw if s["item_id"] in filter_item_ids]
        else:
            states_raw, logs, total_kus = await asyncio.gather(*tasks)
            states = states_raw

        forecast_raw = [
            {"next_review": s["next_review"]}
            for s in states
            if s.get("state") != "burned" and s.get("next_review")
        ]

        unit_groups: dict[str, dict[str, object]] = {}
        srs_spread = {"apprentice": 0, "guru": 0, "master": 0, "enlightened": 0, "burned": 0}
        level_set: set[int] = set()
        due_items_count = 0
        due_breakdown = {"learning": 0, "review": 0}
        now = datetime.now(timezone.utc)

        for s in states:
            ku_id = s["item_id"]
            state = s["state"]
            stab = s["stability"] or 0
            ku = s.get("knowledge_units") or {}
            ku_type = ku.get("type", "unknown")
            if ku_type == "vocab":
                ku_type = "vocabulary"
            level = ku.get("level")
            if level:
                level_set.add(level)

            if ku_id not in unit_groups:
                unit_groups[ku_id] = {"total": 0, "mastered": 0, "burned": 0, "type": ku_type}

            unit_groups[ku_id]["total"] = int(unit_groups[ku_id]["total"]) + 1
            if state == "burned":
                unit_groups[ku_id]["burned"] = int(unit_groups[ku_id]["burned"]) + 1
                srs_spread["burned"] += 1
            elif state == "review":
                unit_groups[ku_id]["mastered"] = int(unit_groups[ku_id]["mastered"]) + 1

            if state != "burned":
                if stab >= 30.0:
                    srs_spread["enlightened"] += 1
                elif stab >= 14.0:
                    srs_spread["master"] += 1
                elif stab >= 3.0:
                    srs_spread["guru"] += 1
                else:
                    srs_spread["apprentice"] += 1

            next_review_str = s.get("next_review")
            if next_review_str and state != "burned":
                next_review = datetime.fromisoformat(next_review_str.replace("Z", "+00:00"))
                if next_review <= now:
                    due_items_count += 1
                    if state == "learning":
                        due_breakdown["learning"] += 1
                    else:
                        due_breakdown["review"] += 1

        unique_kus = list(unit_groups.values())
        total_learned = len(unit_groups)
        total_mastered = len(
            [g for g in unique_kus if (int(g["mastered"]) + int(g["burned"])) > 0 and (int(g["mastered"]) + int(g["burned"])) == int(g["total"])]
        )
        total_burned = len(
            [g for g in unique_kus if int(g["burned"]) > 0 and int(g["burned"]) == int(g["total"])]
        )

        type_mastery_counts = {"radical": 0, "kanji": 0, "vocabulary": 0, "grammar": 0}
        for g in unique_kus:
            item_type = str(g["type"])
            if item_type in type_mastery_counts and (int(g["mastered"]) + int(g["burned"])) == int(g["total"]) and int(g["total"]) > 0:
                type_mastery_counts[item_type] += 1

        type_mastery_pct = TypeMastery(
            radical=round((type_mastery_counts["radical"] / max(total_learned, 1)) * 100),
            kanji=round((type_mastery_counts["kanji"] / max(total_learned, 1)) * 100),
            vocabulary=round((type_mastery_counts["vocabulary"] / max(total_learned, 1)) * 100),
            grammar=round((type_mastery_counts["grammar"] / max(total_learned, 1)) * 100),
        )

        heatmap: dict[str, int] = {}
        last_7_days = [0] * 7
        now_utc = datetime.now(timezone.utc)
        today_str = now_utc.date().isoformat()
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
                if log.get("rating", 3) > 1:
                    correct_today += 1

        retention = round((correct_today / max(today_reviews, 1)) * 100) if today_reviews > 0 else 100
        streak = self._calculate_streak(heatmap, now_utc.date())

        hourly_f = []
        for i in range(24):
            h_start = now_utc + timedelta(hours=i)
            h_end = h_start + timedelta(hours=1)
            count = len(
                [
                    f
                    for f in forecast_raw
                    if h_start
                    <= datetime.fromisoformat(f["next_review"].replace("Z", "+00:00"))
                    < h_end
                ]
            )
            hourly_f.append(ForecastItem(time=h_start.isoformat(), count=count))

        daily_f = []
        for i in range(14):
            d_start = (now_utc + timedelta(days=i)).date()
            count = len(
                [
                    f
                    for f in forecast_raw
                    if datetime.fromisoformat(f["next_review"].replace("Z", "+00:00")).date()
                    == d_start
                ]
            )
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
            streak=streak,
            deckId=deck_id,
        )

    def _calculate_streak(self, heatmap: dict[str, int], today: date) -> int:
        streak = 0
        yesterday = today - timedelta(days=1)

        if today.isoformat() not in heatmap and yesterday.isoformat() not in heatmap:
            return 0

        current = today if today.isoformat() in heatmap else yesterday
        while current.isoformat() in heatmap:
            streak += 1
            current -= timedelta(days=1)
        return streak

    async def get_ku_progress(self, user_id: str, identifier: str) -> KUStatus | None:
        ku = None
        if len(identifier) <= 4 or "-" not in identifier:
            kus = await self.repo.search_kus(identifier, limit=1)
            if kus:
                ku = kus[0]
        ku_id = ku.id if ku else identifier
        return await self.repo.get_ku_status(user_id, ku_id, "meaning")

    async def search_knowledge(self, query: str, limit: int = 10):
        return await self.repo.search_kus(query, limit)

    async def submit_review(
        self, user_id: str, ku_id: str, facet: str, rating: Rating, wrong_count: int = 0
    ) -> KUStatus:
        rating_map = {
            Rating.AGAIN: 1,
            Rating.HARD: 2,
            Rating.GOOD: 3,
            Rating.PASS: 3,
            Rating.EASY: 4,
        }
        rating_int = rating_map.get(rating, 3)

        status, fsrs_settings = await asyncio.gather(
            self.repo.get_ku_status(user_id, ku_id, facet),
            self.repo.get_user_fsrs_settings(user_id),
        )

        current_state = SRSState(
            stage=status.state if status else SRSStage.NEW,
            stability=status.stability if status else 0.1,
            difficulty=status.difficulty if status else 3.0,
            reps=status.reps if status else 0,
            lapses=status.lapses if status else 0,
        )

        weights = [fsrs_settings.get(f"w{i}", 0.0) for i in range(19)]
        if all(value == 0.0 for value in weights):
            weights = [
                0.4,
                0.6,
                2.4,
                5.8,
                4.93,
                0.94,
                0.86,
                1.01,
                1.05,
                0.94,
                0.74,
                0.46,
                0.27,
                0.29,
                0.42,
                0.36,
                0.29,
                1.2,
                0.25,
            ]

        next_review, next_state = FSRSEngine.calculate_next_review(current_state, rating_int, weights)

        new_status = KUStatus(
            user_id=user_id,
            item_id=ku_id,
            facet=facet,
            state=next_state.stage,
            stability=next_state.stability,
            difficulty=next_state.difficulty,
            reps=next_state.reps,
            lapses=next_state.lapses,
            last_review=datetime.now(timezone.utc),
            next_review=next_review,
        )

        await asyncio.gather(
            self.repo.upsert_ku_status(new_status),
            self.repo.log_review(
                user_id=user_id,
                item_id=ku_id,
                facet=facet,
                rating=rating_int,
                state=next_state.stage,
                stability=next_state.stability,
                difficulty=next_state.difficulty,
                interval_days=next_state.stability,
            ),
        )

        return new_status

    async def add_note(self, user_id: str, ku_id: str, note_content: str):
        return await self.repo.add_ku_note(user_id, ku_id, note_content)

    async def get_recent_reviews(self, user_id: str, limit: int = 5):
        return await self.repo.get_recent_reviews(user_id, limit)

    async def get_due_items(self, user_id: str, limit: int = 20):
        enabled_deck_ids = await self.repo.get_enabled_deck_ids(user_id)
        if not enabled_deck_ids:
            return await self.repo.get_due_items(user_id, limit)
        return await self.repo.get_due_items_filtered(user_id, enabled_deck_ids, limit)

    async def list_user_decks(self, user_id: str) -> list[dict]:
        return await self.repo.get_all_decks_with_settings(user_id)

    async def toggle_deck(self, user_id: str, deck_id: str, enabled: bool):
        await self.repo.upsert_user_deck_settings(user_id, deck_id, enabled)
        return {"status": "success", "deck_id": deck_id, "is_enabled": enabled}
