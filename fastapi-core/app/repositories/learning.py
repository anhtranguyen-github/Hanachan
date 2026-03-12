from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from supabase import Client
from app.models.learning import KnowledgeUnit, KUStatus

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
    async def get_review_forecast(self, user_id: str) -> list[dict]:
        pass

    @abstractmethod
    async def get_total_ku_count(self) -> int:
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
            "updated_at": datetime.utcnow().isoformat(),
        }

        self.client.table("user_fsrs_states").upsert(
            data, on_conflict="user_id,item_id,facet"
        ).execute()

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
        now = datetime.utcnow().isoformat()
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
            "updated_at": datetime.utcnow().isoformat(),
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
        start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
        response = (
            self.client.table("fsrs_review_logs")
            .select("reviewed_at, rating")
            .eq("user_id", user_id)
            .gte("reviewed_at", start_date)
            .execute()
        )
        return response.data if response and response.data else []

    async def get_review_forecast(self, user_id: str) -> list[dict]:
        response = (
            self.client.table("user_fsrs_states")
            .select("next_review")
            .eq("user_id", user_id)
            .neq("state", "burned")
            .filter("next_review", "is", "not_null")
            .order("next_review")
            .execute()
        )
        return response.data if response and response.data else []

    async def get_total_ku_count(self) -> int:
        response = (
            self.client.table("knowledge_units")
            .select("*", count="exact")
            .limit(1)
            .execute()
        )
        return (response.count if response else 0) or 1
