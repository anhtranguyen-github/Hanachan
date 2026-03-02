from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from uuid import UUID

from ....core.security import require_auth
from ....services.deck_service import get_deck_service
from ....schemas.decks import Deck, DeckCreate, DeckItem, DeckItemCreate

router = APIRouter()


@router.post("/", response_model=Deck)
async def create_deck(
    deck_in: DeckCreate,
    user: Dict[str, Any] = Depends(require_auth)
):
    """Create a new custom deck."""
    service = get_deck_service()
    deck = service.create_deck(
        user_id=str(user["id"]),
        name=deck_in.name,
        description=deck_in.description
    )
    return deck


@router.get("/", response_model=List[Deck])
async def list_decks(
    user: Dict[str, Any] = Depends(require_auth)
):
    """List all custom decks for the current user."""
    service = get_deck_service()
    decks = service.get_user_decks(user_id=str(user["id"]))
    return decks


@router.get("/{deck_id}", response_model=Deck)
async def get_deck(
    deck_id: UUID,
    user: Dict[str, Any] = Depends(require_auth)
):
    """Get details of a specific deck including its items."""
    service = get_deck_service()
    deck = service.get_deck_details(deck_id=str(deck_id), user_id=str(user["id"]))
    if not deck:
        raise HTTPException(status_code=404, detail="Deck not found")
    return deck


@router.post("/{deck_id}/items", response_model=DeckItem)
async def add_item_to_deck(
    deck_id: UUID,
    item_in: DeckItemCreate,
    user: Dict[str, Any] = Depends(require_auth)
):
    """Add an item (KU, sentence, or video) to a deck."""
    service = get_deck_service()
    try:
        item = service.add_item_to_deck(
            user_id=str(user["id"]),
            deck_id=str(deck_id),
            item_id=str(item_in.item_id),
            item_type=item_in.item_type
        )
        return item
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{deck_id}/items/{item_type}/{item_id}")
async def remove_item_from_deck(
    deck_id: UUID,
    item_type: str,
    item_id: UUID,
    user: Dict[str, Any] = Depends(require_auth)
):
    """Remove an item from a deck."""
    service = get_deck_service()
    success = service.remove_item_from_deck(
        user_id=str(user["id"]),
        deck_id=str(deck_id),
        item_id=str(item_id),
        item_type=item_type
    )
    if not success:
        raise HTTPException(status_code=404, detail="Item or deck not found")
    return {"success": True}


@router.delete("/{deck_id}")
async def delete_deck(
    deck_id: UUID,
    user: Dict[str, Any] = Depends(require_auth)
):
    """Delete an entire deck."""
    service = get_deck_service()
    success = service.delete_deck(user_id=str(user["id"]), deck_id=str(deck_id))
    if not success:
        raise HTTPException(status_code=404, detail="Deck not found")
    return {"success": True}
