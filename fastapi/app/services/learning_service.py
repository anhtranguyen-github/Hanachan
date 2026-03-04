"""
Learning Service — interacts with PostgreSQL to fetch KU definitions and user learning progress.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from app.schemas.learning import KUStatus
from app.core.supabase import supabase

def get_ku_by_character(character: str) -> Optional[Dict[str, Any]]:
    """Find a Knowledge Unit by its character (e.g., '桜')."""
    result = supabase.table("knowledge_units").select("*").eq("character", character).execute()
    return result.data[0] if result.data else None


def get_ku_by_slug(slug: str) -> Optional[Dict[str, Any]]:
    """Find a Knowledge Unit by its slug (e.g., 'sakura')."""
    result = supabase.table("knowledge_units").select("*").eq("slug", slug).execute()
    return result.data[0] if result.data else None


def get_user_learning_state(user_id: str, ku_id: str) -> Optional[Dict[str, Any]]:
    """Fetch the learning state for a specific user and KU."""
    result = supabase.table("user_learning_states") \
        .select("*") \
        .eq("user_id", user_id) \
        .eq("ku_id", ku_id) \
        .execute()
    return result.data[0] if result.data else None


def get_ku_status(user_id: str, identifier: str, include_notes: bool = False) -> Optional[KUStatus]:
    """
    Combined helper: find KU and then attach user's learning state.
    """
    ku = get_ku_by_character(identifier)
    if not ku:
        ku = get_ku_by_slug(identifier)

    if not ku:
        return None

    state_data = get_user_learning_state(user_id, str(ku["id"]))
    
    notes = None
    if include_notes and state_data:
        notes = state_data.get("notes")

    return KUStatus(
        ku_id=str(ku["id"]),
        slug=ku["slug"],
        type=ku["type"],
        character=ku["character"],
        meaning=ku["meaning"],
        level=ku["level"],
        state=state_data["state"] if state_data else "new",
        next_review=state_data["next_review"] if state_data else None,
        last_review=state_data["last_review"] if state_data else None,
        stability=state_data["stability"] if state_data else 0.0,
        difficulty=state_data["difficulty"] if state_data else 5.0,
        reps=state_data["reps"] if state_data else 0,
        lapses=state_data["lapses"] if state_data else 0,
        notes=notes,
        metadata=ku.get("mnemonics") or {},
    )

def add_ku_note(user_id: str, ku_id: str, new_note: str) -> None:
    """Append a new note to a user's specific KU state."""
    if not new_note or not new_note.strip():
        return
        
    state_data = get_user_learning_state(user_id, ku_id)
    
    if state_data:
        existing_notes = state_data.get("notes") or ""
        updated_notes = existing_notes + f"\n- {new_note.strip()}" if existing_notes else f"- {new_note.strip()}"
        
        supabase.table("user_learning_states") \
            .update({"notes": updated_notes}) \
            .eq("user_id", user_id) \
            .eq("ku_id", ku_id) \
            .execute()
    else:
        # Create a new learning state entry with just the notes
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc).isoformat()
        supabase.table("user_learning_states").insert({
            "user_id": user_id,
            "ku_id": ku_id,
            "state": "new",
            "notes": f"- {new_note.strip()}",
            "next_review": now,
            "last_review": now
        }).execute()


def search_kus(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Generic search for KUs by character, slug, or meaning."""
    # We use or filter for character and slug, and ILIKE (Supabase uses 'ilike' operator)
    result = supabase.table("knowledge_units") \
        .select("*") \
        .or_(f"character.eq.{query},slug.eq.{query},meaning.ilike.%{query}%") \
        .limit(limit) \
        .execute()
    return result.data or []

