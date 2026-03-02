"""
Deck Service - manages custom user decks and their items.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional
from uuid import UUID
from datetime import datetime, timezone

from ..core.database import execute_query, execute_single


class DeckService:
    """Service for managing user-defined decks and collections."""

    def create_deck(self, user_id: str, name: str, description: Optional[str] = None) -> Dict[str, Any]:
        """Create a new custom deck for a user."""
        query = """
            INSERT INTO public.decks (user_id, name, description)
            VALUES (%s, %s, %s)
            RETURNING *
        """
        return execute_single(query, (user_id, name, description))

    def get_user_decks(self, user_id: str) -> List[Dict[str, Any]]:
        """List all decks belonging to a specific user."""
        query = "SELECT * FROM public.decks WHERE user_id = %s ORDER BY created_at DESC"
        return execute_query(query, (user_id,))

    def get_deck_details(self, deck_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a single deck's metadata and its items."""
        # Get deck metadata
        deck = execute_single(
            "SELECT * FROM public.decks WHERE id = %s AND user_id = %s",
            (deck_id, user_id)
        )
        if not deck:
            return None

        # Get deck items
        items = execute_query(
            "SELECT * FROM public.deck_items WHERE deck_id = %s ORDER BY created_at ASC",
            (deck_id,)
        )
        
        deck["items"] = items or []
        return deck

    def add_item_to_deck(
        self, 
        user_id: str, 
        deck_id: str, 
        item_id: str, 
        item_type: str
    ) -> Dict[str, Any]:
        """Add a learnable item (KU, sentence, or video) to a deck."""
        # Verify ownership
        deck = execute_single(
            "SELECT id FROM public.decks WHERE id = %s AND user_id = %s",
            (deck_id, user_id)
        )
        if not deck:
            raise ValueError("Deck not found or access denied")

        query = """
            INSERT INTO public.deck_items (deck_id, item_id, item_type)
            VALUES (%s, %s, %s)
            ON CONFLICT (deck_id, item_id, item_type) DO NOTHING
            RETURNING *
        """
        result = execute_single(query, (deck_id, item_id, item_type))
        if not result:
            # Item already exists, return current
            return execute_single(
                "SELECT * FROM public.deck_items WHERE deck_id = %s AND item_id = %s AND item_type = %s",
                (deck_id, item_id, item_type)
            )
        return result

    def remove_item_from_deck(
        self, 
        user_id: str, 
        deck_id: str, 
        item_id: str, 
        item_type: str
    ) -> bool:
        """Remove an item from a user's deck."""
        # Verify ownership
        deck = execute_single(
            "SELECT id FROM public.decks WHERE id = %s AND user_id = %s",
            (deck_id, user_id)
        )
        if not deck:
            return False

        execute_query(
            "DELETE FROM public.deck_items WHERE deck_id = %s AND item_id = %s AND item_type = %s",
            (deck_id, item_id, item_type),
            fetch=False
        )
        return True

    def delete_deck(self, user_id: str, deck_id: str) -> bool:
        """Delete an entire deck and all its items (via cascade)."""
        result = execute_query(
            "DELETE FROM public.decks WHERE id = %s AND user_id = %s RETURNING id",
            (deck_id, user_id)
        )
        return len(result) > 0 if result else False


# Singleton instance
_deck_service: Optional[DeckService] = None


def get_deck_service() -> DeckService:
    """Get the singleton DeckService instance."""
    global _deck_service
    if _deck_service is None:
        _deck_service = DeckService()
    return _deck_service
