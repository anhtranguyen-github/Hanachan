"""
Learning Service — interacts with PostgreSQL to fetch KU definitions and user learning progress.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from ..schemas.learning import KUStatus
from ..core.database import execute_query, execute_single

def get_ku_by_character(character: str) -> Optional[Dict[str, Any]]:
    """Find a Knowledge Unit by its character (e.g., '桜')."""
    return execute_single("SELECT * FROM public.knowledge_units WHERE character = %s", (character,))

def get_ku_by_slug(slug: str) -> Optional[Dict[str, Any]]:
    """Find a Knowledge Unit by its slug (e.g., 'sakura')."""
    return execute_single("SELECT * FROM public.knowledge_units WHERE slug = %s", (slug,))

def get_user_learning_state(user_id: str, ku_id: str) -> Optional[Dict[str, Any]]:
    """Fetch the learning state for a specific user and KU."""
    return execute_single(
        "SELECT * FROM public.user_learning_states WHERE user_id = %s AND ku_id = %s", 
        (user_id, ku_id)
    )

def get_ku_status(user_id: str, identifier: str) -> Optional[KUStatus]:
    """
    Combined helper: find KU and then attach user's learning state.
    Identifier can be a character or a slug.
    """
    ku = get_ku_by_character(identifier)
    if not ku:
        ku = get_ku_by_slug(identifier)
    
    if not ku:
        return None
    
    state_data = get_user_learning_state(user_id, str(ku["id"]))
    
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
        metadata=ku.get("mnemonics") or {}
    )

def search_kus(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    """Generic search for KUs by character, slug, or meaning."""
    return execute_query(
        "SELECT * FROM public.knowledge_units "
        "WHERE character = %s OR slug = %s OR meaning ILIKE %s LIMIT %s",
        (query, query, f"%{query}%", limit)
    )
