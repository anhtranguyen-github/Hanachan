import logging
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone

from supabase import Client

from app.domain.learning.models import KUStatus, KnowledgeUnit

logger = logging.getLogger(__name__)


class ILearningRepository(ABC):
    @abstractmethod
    async def get_ku_status(self, user_id: str, ku_id: str, facet: str) -> KUStatus | None:
        pass

    @abstractmethod
    async def upsert_ku_status(self, status: KUStatus) -> None:
        pass

    @abstractmethod
    async def search_kus(self, query: str, limit: int = 10) -> list[KnowledgeUnit]:
        pass

    @abstractmethod
    async def get_due_items(self, user_id: str, limit: int = 20) -> list[KUStatus]:
        pass

    @abstractmethod
    async def add_ku_note(self, user_id: str, ku_id: str, note_content: str) -> None:
        pass

    @abstractmethod
    async def get_all_user_states(self, user_id: str) -> list[dict]:
        pass

    @abstractmethod
    async def get_review_logs(self, user_id: str, days: int = 365) -> list[dict]:
        pass

    @abstractmethod
    async def get_total_ku_count(self) -> int:
        pass

    @abstractmethod
    async def get_recent_reviews(self, user_id: str, limit: int = 5) -> list[dict]:
        pass

    @abstractmethod
    async def get_user_fsrs_settings(self, user_id: str) -> dict:
        pass

    @abstractmethod
    async def log_review(
        self,
        user_id: str,
        item_id: str,
        facet: str,
        rating: int,
        state: str,
        stability: float,
        difficulty: float,
        interval_days: float,
    ) -> None:
        pass

    @abstractmethod
    async def get_enabled_deck_ids(self, user_id: str) -> list[str]:
        pass

    @abstractmethod
    async def get_due_items_filtered(
        self, user_id: str, deck_ids: list[str], limit: int = 20
    ) -> list[KUStatus]:
        pass

    @abstractmethod
    async def get_deck_items(self, deck_id: str) -> list[str]:
        pass

    @abstractmethod
    async def get_all_decks_with_settings(self, user_id: str) -> list[dict]:
        pass

    @abstractmethod
    async def upsert_user_deck_settings(self, user_id: str, deck_id: str, is_enabled: bool) -> None:
        pass


class SupabaseLearningRepository(ILearningRepository):
    def __init__(self, client: Client):
        self.client = client

    async def get_ku_status(self, user_id: str, ku_id: str, facet: str) -> KUStatus | None:
        response = (
            self.client.table("user_fsrs_states")
            .select("*, knowledge_units(*)")
            .eq("user_id", user_id)
            .eq("item_id", ku_id)
            .eq("facet", facet)
            .maybe_single()
            .execute()
        )
        if response is None or not response.data:
            return None

        data = response.data
        ku_data = data.get("knowledge_units", {})

        return KUStatus(
            user_id=data["user_id"],
            item_id=data["item_id"],
            item_type=data.get("item_type", "ku"),
            facet=data["facet"],
            state=data["state"],
            stability=data["stability"],
            difficulty=data["difficulty"],
            reps=data["reps"],
            lapses=data["lapses"],
            last_review=datetime.fromisoformat(data["last_review"]) if data.get("last_review") else None,
            next_review=datetime.fromisoformat(data["next_review"]) if data.get("next_review") else None,
            character=ku_data.get("character"),
            meaning=ku_data.get("meaning"),
            notes=data.get("notes"),
        )

    async def upsert_ku_status(self, status: KUStatus) -> None:
        data = {
            "user_id": status.user_id,
            "item_id": status.item_id,
            "item_type": status.item_type,
            "facet": status.facet,
            "state": status.state,
            "stability": status.stability,
            "difficulty": status.difficulty,
            "reps": status.reps,
            "lapses": status.lapses,
            "last_review": status.last_review.isoformat() if status.last_review else None,
            "next_review": status.next_review.isoformat() if status.next_review else None,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        self.client.table("user_fsrs_states").upsert(data).execute()

    async def search_kus(self, query: str, limit: int = 10) -> list[KnowledgeUnit]:
        response = (
            self.client.table("knowledge_units")
            .select("*")
            .or_(f"character.ilike.%{query}%,meaning.ilike.%{query}%,slug.ilike.%{query}%")
            .limit(limit)
            .execute()
        )
        if response is None or not response.data:
            return []
        return [KnowledgeUnit(**item) for item in response.data]

    async def get_due_items(self, user_id: str, limit: int = 20) -> list[KUStatus]:
        now = datetime.now(timezone.utc).isoformat()
        response = (
            self.client.table("user_fsrs_states")
            .select("*, knowledge_units(*)")
            .eq("user_id", user_id)
            .lte("next_review", now)
            .neq("state", "burned")
            .order("next_review")
            .limit(limit)
            .execute()
        )

        results = []
        if response and response.data:
            for data in response.data:
                ku_data = data.get("knowledge_units", {})
                results.append(
                    KUStatus(
                        user_id=data["user_id"],
                        item_id=data["item_id"],
                        facet=data["facet"],
                        state=data["state"],
                        stability=data["stability"],
                        difficulty=data["difficulty"],
                        reps=data["reps"],
                        lapses=data["lapses"],
                        next_review=datetime.fromisoformat(data["next_review"]) if data.get("next_review") else None,
                        character=ku_data.get("character"),
                        meaning=ku_data.get("meaning"),
                    )
                )
        return results

    async def add_ku_note(self, user_id: str, ku_id: str, note_content: str) -> None:
        data = {
            "user_id": user_id,
            "item_id": ku_id,
            "facet": "meaning",
            "notes": note_content,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        self.client.table("user_fsrs_states").upsert(
            data, on_conflict="user_id,item_id,facet"
        ).execute()

    async def get_all_user_states(self, user_id: str) -> list[dict]:
        response = (
            self.client.table("user_fsrs_states")
            .select("state, item_id, last_review, next_review, stability, knowledge_units(type, level)")
            .eq("user_id", user_id)
            .execute()
        )
        return response.data if response and response.data else []

    async def get_review_logs(self, user_id: str, days: int = 365) -> list[dict]:
        start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        response = (
            self.client.table("fsrs_review_logs")
            .select("reviewed_at, rating")
            .eq("user_id", user_id)
            .gte("reviewed_at", start_date)
            .execute()
        )
        return response.data if response and response.data else []

    async def get_total_ku_count(self) -> int:
        response = self.client.table("knowledge_units").select("*", count="exact").limit(1).execute()
        return (response.count if response else 0) or 1

    async def get_recent_reviews(self, user_id: str, limit: int = 5) -> list[dict]:
        response = (
            self.client.table("fsrs_review_logs")
            .select("*, knowledge_units(character, meaning)")
            .eq("user_id", user_id)
            .order("reviewed_at", desc=True)
            .limit(limit)
            .execute()
        )
        return response.data if response and response.data else []

    async def get_user_fsrs_settings(self, user_id: str) -> dict:
        response = (
            self.client.table("user_fsrs_settings")
            .select("*")
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        if response and response.data:
            return response.data

        default_data = {"user_id": user_id}
        resp = self.client.table("user_fsrs_settings").insert(default_data).execute()
        return resp.data[0] if resp.data else default_data

    async def log_review(
        self,
        user_id: str,
        item_id: str,
        facet: str,
        rating: int,
        state: str,
        stability: float,
        difficulty: float,
        interval_days: float,
    ) -> None:
        data = {
            "user_id": user_id,
            "item_id": item_id,
            "item_type": "ku",
            "facet": facet,
            "rating": rating,
            "state": state,
            "stability": stability,
            "difficulty": difficulty,
            "interval_days": interval_days,
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
        }
        self.client.table("fsrs_review_logs").insert(data).execute()

    async def get_enabled_deck_ids(self, user_id: str) -> list[str]:
        try:
            response = (
                self.client.table("user_deck_settings")
                .select("deck_id")
                .eq("user_id", user_id)
                .eq("is_enabled", True)
                .execute()
            )
            return [item["deck_id"] for item in response.data] if response and response.data else []
        except Exception as e:
            logger.warning(f"Could not fetch enabled decks (table might be missing): {e}")
            return []

    async def get_due_items_filtered(
        self, user_id: str, deck_ids: list[str], limit: int = 20
    ) -> list[KUStatus]:
        if not deck_ids:
            return []

        deck_items_resp = self.client.table("deck_items").select("item_id").in_("deck_id", deck_ids).execute()
        item_ids = [item["item_id"] for item in deck_items_resp.data] if deck_items_resp and deck_items_resp.data else []

        if not item_ids:
            return []

        now = datetime.now(timezone.utc).isoformat()
        response = (
            self.client.table("user_fsrs_states")
            .select("*, knowledge_units(*)")
            .eq("user_id", user_id)
            .in_("item_id", item_ids)
            .lte("next_review", now)
            .neq("state", "burned")
            .order("next_review")
            .limit(limit)
            .execute()
        )

        results = []
        if response and response.data:
            for data in response.data:
                ku_data = data.get("knowledge_units", {})
                results.append(
                    KUStatus(
                        user_id=data["user_id"],
                        item_id=data["item_id"],
                        facet=data["facet"],
                        state=data["state"],
                        stability=data["stability"],
                        difficulty=data["difficulty"],
                        reps=data["reps"],
                        lapses=data["lapses"],
                        next_review=datetime.fromisoformat(data["next_review"]) if data.get("next_review") else None,
                        character=ku_data.get("character"),
                        meaning=ku_data.get("meaning"),
                    )
                )
        return results

    async def get_deck_items(self, deck_id: str) -> list[str]:
        response = self.client.table("deck_items").select("item_id").eq("deck_id", deck_id).execute()
        return [item["item_id"] for item in response.data] if response and response.data else []

    async def get_all_decks_with_settings(self, user_id: str) -> list[dict]:
        decks_resp = self.client.table("decks").select("*").or_(f"user_id.eq.{user_id},is_system.eq.true").execute()
        decks = decks_resp.data if decks_resp else []

        settings_resp = self.client.table("user_deck_settings").select("*").eq("user_id", user_id).execute()
        settings_dict = {item["deck_id"]: item["is_enabled"] for item in settings_resp.data} if settings_resp else {}

        for deck in decks:
            deck["is_enabled"] = settings_dict.get(deck["id"], False)

        return decks

    async def upsert_user_deck_settings(self, user_id: str, deck_id: str, is_enabled: bool) -> None:
        data = {
            "user_id": user_id,
            "deck_id": deck_id,
            "is_enabled": is_enabled,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        self.client.table("user_deck_settings").upsert(data, on_conflict="user_id,deck_id").execute()
