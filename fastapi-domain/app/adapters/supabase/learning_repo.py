from typing import List, Optional, Dict
from datetime import datetime
from supabase import Client
from .models import KUStatus, KnowledgeUnit, SRSStage

class LearningRepository:
    def __init__(self, client: Client):
        self.client = client

    async def get_ku_status(self, user_id: str, ku_id: str, facet: str) -> Optional[KUStatus]:
        response = self.client.table("user_fsrs_states")\
            .select("*, knowledge_units(*)")\
            .eq("user_id", user_id)\
            .eq("item_id", ku_id)\
            .eq("facet", facet)\
            .maybe_single()\
            .execute()
        
        if not response.data:
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
            notes=data.get("notes") # If notes are stored in states
        )

    async def upsert_ku_status(self, status: KUStatus):
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
            "updated_at": datetime.utcnow().isoformat()
        }
        
        self.client.table("user_fsrs_states").upsert(data, on_conflict="user_id,item_id,facet").execute()

    async def search_kus(self, query: str, limit: int = 10) -> List[KnowledgeUnit]:
        # Search by character, meaning or slug
        response = self.client.table("knowledge_units")\
            .select("*")\
            .or_(f"character.ilike.%{query}%,meaning.ilike.%{query}%,slug.ilike.%{query}%")\
            .limit(limit)\
            .execute()
            
        return [KnowledgeUnit(**item) for item in response.data]

    async def get_due_items(self, user_id: str, limit: int = 20) -> List[KUStatus]:
        now = datetime.utcnow().isoformat()
        response = self.client.table("user_fsrs_states")\
            .select("*, knowledge_units(*)")\
            .eq("user_id", user_id)\
            .lte("next_review", now)\
            .neq("state", "burned")\
            .order("next_review")\
            .limit(limit)\
            .execute()
            
        # Parse results...
        results = []
        for data in response.data:
            ku_data = data.get("knowledge_units", {})
            results.append(KUStatus(
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
                meaning=ku_data.get("meaning")
            ))
        return results

    async def add_ku_note(self, user_id: str, ku_id: str, note_content: str):
        # We append to existing or overwrite? Let's assume overwrite/set as per current logic
        data = {
            "user_id": user_id,
            "item_id": ku_id,
            "facet": "meaning", # Notes are usually tied to meaning/general
            "notes": note_content,
            "updated_at": datetime.utcnow().isoformat()
        }
        self.client.table("user_fsrs_states").upsert(data, on_conflict="user_id,item_id,facet").execute()
