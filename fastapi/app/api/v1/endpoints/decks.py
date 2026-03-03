"""
Deck API Endpoints

Architecture Note:
  Auth removed from FastAPI per architecture rules.
  FastAPI = Agents ONLY (stateless, no auth)
  Auth handled by Supabase/Next.js (BFF pattern)
  user_id passed in request body/query from trusted Next.js layer
"""

from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Query, Request
from uuid import UUID

from ....core.rate_limit import limiter
from ....core.config import settings
from ....services.deck_service import get_deck_service
from ....schemas.decks import Deck, DeckCreate, DeckItem, DeckItemCreate

router = APIRouter()


@router.post("/", response_model=Deck)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def create_deck(
    request: Request,
    deck_in: DeckCreate,
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
):
    """Create a new custom deck.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.
    """
    service = get_deck_service()
    deck = service.create_deck(
        user_id=user_id,
        name=deck_in.name,
        description=deck_in.description
    )
    return deck


@router.get("/", response_model=List[Deck])
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def list_decks(
    request: Request,
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
):
    """List all custom decks for the current user.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.
    """
    service = get_deck_service()
    decks = service.get_user_decks(user_id=user_id)
    return decks


@router.get("/{deck_id}", response_model=Deck)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def get_deck(
    request: Request,
    deck_id: UUID,
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
):
    """Get details of a specific deck including its items.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.
    """
    service = get_deck_service()
    deck = service.get_deck_details(deck_id=str(deck_id), user_id=user_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck


@router.post("/{deck_id}/items", response_model=DeckItem)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def add_item_to_deck(
    request: Request,
    deck_id: UUID,
    item_in: DeckItemCreate,
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
):
    """Add an item (KU, sentence, or video) to a deck.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.
    """
    service = get_deck_service()
    try:
        item = service.add_item_to_deck(
            user_id=user_id,
            deck_id=str(deck_id),
            item_id=str(item_in.item_id),
            item_type=item_in.item_type
        )
        return item
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{deck_id}/items/{item_type}/{item_id}")
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def remove_item_from_deck(
    request: Request,
    deck_id: UUID,
    item_type: str,
    item_id: UUID,
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
):
    """Remove an item from a deck.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.
    """
    service = get_deck_service()
    success = service.remove_item_from_deck(
        user_id=user_id,
        deck_id=str(deck_id),
        item_id=str(item_id),
        item_type=item_type
    )
    if not success:
        raise HTTPException(status_code=404, detail="Item or deck not found")
    return {"success": True}


@router.delete("/{deck_id}")
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def delete_deck(
    request: Request,
    deck_id: UUID,
    user_id: str = Query(..., description="User ID (validated by Next.js/Supabase)"),
):
    """Delete an entire deck.

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id is trusted.
    """
    service = get_deck_service()
    success = service.delete_deck(user_id=user_id, deck_id=str(deck_id))
    if not success:
        raise HTTPException(status_code=404, detail="Deck not found")
    return {"success": True}
