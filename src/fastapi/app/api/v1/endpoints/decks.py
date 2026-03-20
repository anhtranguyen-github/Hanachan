from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.api.core_deps import get_deck_service
from app.api.deps import get_current_user
from app.domain.chat.deck_service import DeckService

router = APIRouter(prefix="/decks", tags=["Decks"])


class DeckCreate(BaseModel):
    name: str
    description: str | None = None


class DeckItem(BaseModel):
    item_id: str
    item_type: str = "ku"


@router.post("")
async def create_deck(
    payload: DeckCreate,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: DeckService = Depends(get_deck_service),
):
    try:
        return await service.create_deck(current_user["id"], payload.name, payload.description)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
async def list_decks(
    current_user: dict[str, Any] = Depends(get_current_user),
    service: DeckService = Depends(get_deck_service),
):
    return await service.list_decks(current_user["id"])


@router.post("/{deck_id}/items")
async def add_deck_item(
    deck_id: str,
    payload: DeckItem,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: DeckService = Depends(get_deck_service),
):
    try:
        return await service.add_deck_item(
            current_user["id"], deck_id, payload.item_id, payload.item_type
        )
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.get("/{deck_id}")
async def get_deck(
    deck_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: DeckService = Depends(get_deck_service),
):
    try:
        items = await service.view_deck_contents(current_user["id"], deck_id)
        decks = await service.list_decks(current_user["id"])
        deck = next((deck for deck in decks if str(deck["id"]) == deck_id), None)
        if not deck:
            raise HTTPException(status_code=404, detail="Deck not found")
        deck["items"] = items
        return deck
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))


@router.delete("/{deck_id}")
async def delete_deck(
    deck_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
    service: DeckService = Depends(get_deck_service),
):
    try:
        await service.delete_deck(current_user["id"], deck_id)
        return {"status": "success"}
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
