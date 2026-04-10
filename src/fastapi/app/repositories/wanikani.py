"""
WaniKani-style repository — all Supabase data access for the v2 API.
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

from supabase import Client

logger = logging.getLogger(__name__)


class WaniKaniRepository:
    """Repository for WaniKani-style data access via Supabase client."""

    def __init__(self, client: Client):
        self.client = client

    def _ensure_json(self, value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except Exception:
                return value
        return value

    async def list_subjects(
        self,
        types: list[str] | None = None,
        levels: list[int] | None = None,
        slugs: list[str] | None = None,
        ids: list[int] | None = None,
        hidden: bool = False,
        updated_after: datetime | None = None,
        page: int = 1,
        per_page: int = 500,
    ) -> tuple[list[dict], int]:
        query = self.client.table("subjects").select("*, subject_details(*)", count="exact")

        if not hidden:
            query = query.is_("hidden_at", "null")
        if types:
            query = query.in_("type", types)
        if levels:
            query = query.in_("level", levels)
        if slugs:
            query = query.in_("slug", slugs)
        if ids:
            query = query.in_("id", ids)
        if updated_after:
            query = query.gte("data_updated_at", updated_after.isoformat())

        offset = (page - 1) * per_page
        query = query.order("id").range(offset, offset + per_page - 1)

        res = query.execute()
        total = res.count or 0
        data = res.data or []
        for s in data:
            s["meanings"] = self._ensure_json(s.get("meanings"))
            s["readings"] = self._ensure_json(s.get("readings"))
            s["auxiliary_meanings"] = self._ensure_json(s.get("auxiliary_meanings"))
        return data, total

    async def get_subject(self, subject_id: int) -> dict | None:
        res = (
            self.client.table("subjects")
            .select("*, subject_details(*)")
            .eq("id", subject_id)
            .maybe_single()
            .execute()
        )
        if res and res.data:
            s = res.data
            s["meanings"] = self._ensure_json(s.get("meanings"))
            s["readings"] = self._ensure_json(s.get("readings"))
            s["auxiliary_meanings"] = self._ensure_json(s.get("auxiliary_meanings"))
            return s
        return None

    # ── Assignments ───────────────────────────────────────────

    async def list_assignments(
        self,
        user_id: str,
        subject_ids: list[int] | None = None,
        available_before: datetime | None = None,
        available_after: datetime | None = None,
        srs_stages: list[int] | None = None,
        burned: bool | None = None,
        started: bool | None = None,
        hidden: bool = False,
        updated_after: datetime | None = None,
        page: int = 1,
        per_page: int = 500,
    ) -> tuple[list[dict], int]:
        query = (
            self.client.table("assignments")
            .select("*", count="exact")
            .eq("user_id", user_id)
        )

        if subject_ids:
            query = query.in_("subject_id", subject_ids)
        if available_before:
            query = query.lte("available_at", available_before.isoformat())
        if available_after:
            query = query.gte("available_at", available_after.isoformat())
        if srs_stages:
            query = query.in_("srs_stage", srs_stages)
        if burned is True:
            query = query.not_("burned_at", "is", "null")
        elif burned is False:
            query = query.is_("burned_at", "null")
        if started is True:
            query = query.not_("started_at", "is", "null")
        elif started is False:
            query = query.is_("started_at", "null")
        if not hidden:
            query = query.eq("hidden", False)
        if updated_after:
            query = query.gte("data_updated_at", updated_after.isoformat())

        offset = (page - 1) * per_page
        query = query.order("id").range(offset, offset + per_page - 1)

        res = query.execute()
        total = res.count or 0
        return res.data or [], total

    async def get_assignment(self, user_id: str, assignment_id: int) -> dict | None:
        res = (
            self.client.table("assignments")
            .select("*")
            .eq("id", assignment_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        return res.data if res else None

    async def get_assignment_for_subject(self, user_id: str, subject_id: int) -> dict | None:
        res = (
            self.client.table("assignments")
            .select("*")
            .eq("user_id", user_id)
            .eq("subject_id", subject_id)
            .maybe_single()
            .execute()
        )
        return res.data if res else None

    async def upsert_assignment(self, data: dict) -> dict:
        data["data_updated_at"] = datetime.now(timezone.utc).isoformat()
        res = self.client.table("assignments").upsert(data, on_conflict="user_id,subject_id").execute()
        return res.data[0] if res.data else data

    async def start_assignment(self, user_id: str, assignment_id: int) -> dict | None:
        now = datetime.now(timezone.utc).isoformat()
        res = (
            self.client.table("assignments")
            .update({
                "started_at": now,
                "srs_stage": 1,
                "available_at": now,
                "data_updated_at": now,
            })
            .eq("id", assignment_id)
            .eq("user_id", user_id)
            .execute()
        )
        return res.data[0] if res.data else None

    # ── Reviews ───────────────────────────────────────────────

    async def create_review(self, data: dict) -> dict:
        res = self.client.table("reviews").insert(data).execute()
        return res.data[0] if res.data else data

    async def list_reviews(
        self,
        user_id: str,
        assignment_ids: list[int] | None = None,
        subject_ids: list[int] | None = None,
        updated_after: datetime | None = None,
        page: int = 1,
        per_page: int = 500,
    ) -> tuple[list[dict], int]:
        query = (
            self.client.table("reviews")
            .select("*", count="exact")
            .eq("user_id", user_id)
        )

        if assignment_ids:
            query = query.in_("assignment_id", assignment_ids)
        if subject_ids:
            query = query.in_("subject_id", subject_ids)
        if updated_after:
            query = query.gte("created_at", updated_after.isoformat())

        offset = (page - 1) * per_page
        query = query.order("created_at", desc=True).range(offset, offset + per_page - 1)

        res = query.execute()
        total = res.count or 0
        return res.data or [], total

    # ── Review Statistics ─────────────────────────────────────

    async def upsert_review_statistics(self, data: dict) -> dict:
        data["data_updated_at"] = datetime.now(timezone.utc).isoformat()
        res = self.client.table("review_statistics").upsert(data, on_conflict="user_id,subject_id").execute()
        return res.data[0] if res.data else data

    async def get_review_statistics(self, user_id: str, subject_id: int) -> dict | None:
        res = (
            self.client.table("review_statistics")
            .select("*")
            .eq("user_id", user_id)
            .eq("subject_id", subject_id)
            .maybe_single()
            .execute()
        )
        return res.data if res else None

    async def list_review_statistics(
        self, user_id: str, page: int = 1, per_page: int = 500
    ) -> tuple[list[dict], int]:
        offset = (page - 1) * per_page
        res = (
            self.client.table("review_statistics")
            .select("*", count="exact")
            .eq("user_id", user_id)
            .order("id")
            .range(offset, offset + per_page - 1)
            .execute()
        )
        total = res.count or 0
        return res.data or [], total

    # ── Study Materials ───────────────────────────────────────

    async def upsert_study_material(self, data: dict) -> dict:
        data["data_updated_at"] = datetime.now(timezone.utc).isoformat()
        res = self.client.table("study_materials").upsert(data, on_conflict="user_id,subject_id").execute()
        return res.data[0] if res.data else data

    async def list_study_materials(
        self, user_id: str, page: int = 1, per_page: int = 500
    ) -> tuple[list[dict], int]:
        offset = (page - 1) * per_page
        res = (
            self.client.table("study_materials")
            .select("*", count="exact")
            .eq("user_id", user_id)
            .order("id")
            .range(offset, offset + per_page - 1)
            .execute()
        )
        total = res.count or 0
        return res.data or [], total

    # ── SRS Systems ───────────────────────────────────────────

    async def list_srs_systems(self) -> list[dict]:
        res = self.client.table("spaced_repetition_systems").select("*").execute()
        return res.data or []

    async def get_srs_system(self, system_id: int) -> dict | None:
        res = (
            self.client.table("spaced_repetition_systems")
            .select("*")
            .eq("id", system_id)
            .maybe_single()
            .execute()
        )
        return res.data if res else None

    # ── Level Progressions ────────────────────────────────────

    async def list_level_progressions(
        self, user_id: str, page: int = 1, per_page: int = 500
    ) -> tuple[list[dict], int]:
        offset = (page - 1) * per_page
        res = (
            self.client.table("level_progressions")
            .select("*", count="exact")
            .eq("user_id", user_id)
            .order("level")
            .range(offset, offset + per_page - 1)
            .execute()
        )
        total = res.count or 0
        return res.data or [], total

    # ── User Profile ──────────────────────────────────────────

    async def get_user_profile(self, auth_user_id: str) -> dict | None:
        res = (
            self.client.table("users_profile")
            .select("*")
            .eq("auth_user_id", auth_user_id)
            .maybe_single()
            .execute()
        )
        return res.data if res else None

    async def upsert_user_profile(self, data: dict) -> dict:
        data["data_updated_at"] = datetime.now(timezone.utc).isoformat()
        res = self.client.table("users_profile").upsert(data, on_conflict="auth_user_id").execute()
        return res.data[0] if res.data else data

    # ── Custom Decks ──────────────────────────────────────────

    async def create_custom_deck(self, user_id: str, name: str, description: str | None, config: dict) -> dict:
        data = {
            "user_id": user_id,
            "name": name,
            "description": description,
            "config": json.dumps(config) if isinstance(config, dict) else config,
        }
        res = self.client.table("custom_decks").insert(data).execute()
        return res.data[0] if res.data else data

    async def list_custom_decks(self, user_id: str) -> list[dict]:
        res = self.client.table("custom_decks").select("*").eq("user_id", user_id).order("created_at").execute()
        return res.data or []

    async def get_custom_deck(self, deck_id: int, user_id: str) -> dict | None:
        res = (
            self.client.table("custom_decks")
            .select("*")
            .eq("id", deck_id)
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        return res.data if res else None

    async def update_custom_deck(self, deck_id: int, user_id: str, updates: dict) -> dict | None:
        updates["data_updated_at"] = datetime.now(timezone.utc).isoformat()
        if "config" in updates and isinstance(updates["config"], dict):
            updates["config"] = json.dumps(updates["config"])
        res = (
            self.client.table("custom_decks")
            .update(updates)
            .eq("id", deck_id)
            .eq("user_id", user_id)
            .execute()
        )
        return res.data[0] if res.data else None

    async def delete_custom_deck(self, deck_id: int, user_id: str) -> bool:
        res = (
            self.client.table("custom_decks")
            .delete()
            .eq("id", deck_id)
            .eq("user_id", user_id)
            .execute()
        )
        return bool(res.data)

    async def add_custom_deck_items(self, deck_id: int, subject_ids: list[int], custom_level: int = 1) -> list[dict]:
        rows = [
            {"deck_id": deck_id, "subject_id": sid, "custom_level": custom_level}
            for sid in subject_ids
        ]
        res = self.client.table("custom_deck_items").upsert(rows, on_conflict="deck_id,subject_id").execute()
        return res.data or []

    async def list_custom_deck_items(self, deck_id: int) -> list[dict]:
        res = (
            self.client.table("custom_deck_items")
            .select("*, subjects(*)")
            .eq("deck_id", deck_id)
            .order("custom_level")
            .execute()
        )
        return res.data or []

    async def remove_custom_deck_item(self, deck_id: int, subject_id: int) -> bool:
        res = (
            self.client.table("custom_deck_items")
            .delete()
            .eq("deck_id", deck_id)
            .eq("subject_id", subject_id)
            .execute()
        )
        return bool(res.data)

    # ── Custom Deck Progress ──────────────────────────────────

    async def get_custom_deck_reviews(
        self,
        deck_id: int,
        user_id: str,
    ) -> list[dict]:
        """Get items due for review in a custom deck using Min(global, custom) logic."""
        now = datetime.now(timezone.utc).isoformat()

        # Get deck items
        items_res = (
            self.client.table("custom_deck_items")
            .select("subject_id")
            .eq("deck_id", deck_id)
            .execute()
        )
        if not items_res.data:
            return []

        subject_ids = [item["subject_id"] for item in items_res.data]

        # Get global assignments for these subjects
        assignments_res = (
            self.client.table("assignments")
            .select("*")
            .eq("user_id", user_id)
            .in_("subject_id", subject_ids)
            .is_("burned_at", "null")
            .lte("available_at", now)
            .execute()
        )

        # Get custom deck progress for these subjects
        progress_res = (
            self.client.table("custom_deck_progress")
            .select("*")
            .eq("deck_id", deck_id)
            .eq("user_id", user_id)
            .in_("subject_id", subject_ids)
            .execute()
        )
        progress_map = {p["subject_id"]: p for p in (progress_res.data or [])}

        # Apply Min(global, custom) logic:
        # An item is due if EITHER global OR custom says it's due
        due_items = []
        for a in (assignments_res.data or []):
            sid = a["subject_id"]
            custom = progress_map.get(sid)

            effective_stage = a["srs_stage"]
            if custom:
                # Use the minimum stage (more conservative = more reviews)
                effective_stage = min(a["srs_stage"], custom.get("custom_srs_stage", a["srs_stage"]))
                # Check custom next review
                custom_next = custom.get("custom_next_review_at")
                if custom_next and custom_next > now:
                    continue  # Custom says not due yet

            due_items.append({
                **a,
                "effective_srs_stage": effective_stage,
                "custom_progress": custom,
            })

        return due_items

    async def upsert_custom_deck_progress(self, data: dict) -> dict:
        data["data_updated_at"] = datetime.now(timezone.utc).isoformat()
        res = self.client.table("custom_deck_progress").upsert(
            data, on_conflict="deck_id,user_id,subject_id"
        ).execute()
        return res.data[0] if res.data else data

    # ── Summary ───────────────────────────────────────────────

    async def get_review_summary(self, user_id: str) -> dict:
        """Get count of available reviews and lessons."""
        now = datetime.now(timezone.utc).isoformat()

        # Reviews available
        reviews_res = (
            self.client.table("assignments")
            .select("subject_id, available_at", count="exact")
            .eq("user_id", user_id)
            .is_("burned_at", "null")
            .lte("available_at", now)
            .not_("started_at", "is", "null")
            .execute()
        )

        # Lessons available (unlocked but not started)
        lessons_res = (
            self.client.table("assignments")
            .select("subject_id", count="exact")
            .eq("user_id", user_id)
            .eq("srs_stage", 0)
            .is_("started_at", "null")
            .not_("unlocked_at", "is", "null")
            .execute()
        )

        return {
            "reviews": reviews_res.data or [],
            "reviews_count": reviews_res.count or 0,
            "lessons": lessons_res.data or [],
            "lessons_count": lessons_res.count or 0,
        }
