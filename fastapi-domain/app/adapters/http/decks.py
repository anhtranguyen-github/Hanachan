import os
from typing import Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from supabase import Client, create_client

from app.auth.jwt import get_current_user_id

router = APIRouter(prefix="/decks", tags=["decks"])

class DeckCreate(BaseModel):
    name: str
    description: Optional[str] = None

class DeckItem(BaseModel):
    item_id: str
    item_type: str = "ku"


def get_db_client() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    return create_client(url, key)

@router.post("", response_model=Dict[str, Any])
async def create_deck(
    payload: DeckCreate,
    user_id: str = Depends(get_current_user_id),
    client: Client = Depends(get_db_client)
):
    try:
        response = client.table("decks").insert({
            "user_id": user_id,
            "name": payload.name,
            "description": payload.description
        }).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{deck_id}/items", response_model=Dict[str, Any])
async def add_deck_item(
    deck_id: str,
    payload: DeckItem,
    user_id: str = Depends(get_current_user_id),
    client: Client = Depends(get_db_client)
):
    # Verify deck ownership first (enforce invariant)
    deck_res = client.table("decks").select("user_id").eq("id", deck_id).execute()
    if not deck_res.data or deck_res.data[0]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Deck not found or access denied")
    
    try:
        response = client.table("deck_items").insert({
            "deck_id": deck_id,
            "item_id": payload.item_id,
            "item_type": payload.item_type
        }).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
