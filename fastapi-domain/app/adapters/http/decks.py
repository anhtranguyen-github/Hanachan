import os
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client, create_client

from app.auth.jwt import get_current_user_id
from app.domain.services.deck_service import DeckService

router = APIRouter(prefix="/decks", tags=["decks"])


class DeckCreate(BaseModel):
    name: str
    description: str | None = None


class DeckItem(BaseModel):
    item_id: str
    item_type: str = "ku"


def get_db_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    return create_client(url, key)


@router.post("", response_model=dict[str, Any])
async def create_deck(
    payload: DeckCreate,
    user_id: str = Depends(get_current_user_id),
    client: Client = Depends(get_db_client),
):
    try:
        data = await DeckService.create_deck(
            user_id=user_id, name=payload.name, description=payload.description
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{deck_id}/items", response_model=dict[str, Any])
async def add_deck_item(
    deck_id: str,
    payload: DeckItem,
    user_id: str = Depends(get_current_user_id),
    client: Client = Depends(get_db_client),
):
    try:
        data = await DeckService.add_deck_item(
            user_id=user_id,
            deck_id=deck_id,
            item_identifier=payload.item_id,
            item_type=payload.item_type,
        )
        return data
    except Exception as e:
        if "denied" in str(e).lower():
            raise HTTPException(status_code=403, detail="Deck not found or access denied")
        raise HTTPException(status_code=400, detail=str(e))
