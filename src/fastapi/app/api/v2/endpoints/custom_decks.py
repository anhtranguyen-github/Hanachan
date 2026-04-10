from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional
from datetime import datetime, timezone

from app.api import core_deps as deps
from app.repositories.wanikani import WaniKaniRepository
from app.schemas.wanikani import (
    CustomDeckData, CustomDeckCreateRequest, CustomDeckUpdateRequest,
    CustomDeckItemData, CustomDeckAddItemsRequest,
    CustomDeckProgressData, BaseResource, BaseCollection
)
from app.domain.srs.models import CustomDeckConfig, DeckConfigPreset

router = APIRouter(prefix="/custom_decks")

@router.get("", response_model=BaseCollection)
async def list_custom_decks(
    current_user: dict = Depends(deps.get_current_user),
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    user_id = current_user["sub"]
    decks = await repo.list_custom_decks(user_id)
    
    data = []
    for d in decks:
        data.append(BaseResource(
            id=d["id"],
            object="custom_deck",
            url=f"/custom_decks/{d['id']}",
            data_updated_at=d["data_updated_at"],
            data=d
        ))
        
    return BaseCollection(
        object="collection",
        url="/custom_decks",
        total_count=len(data),
        data=data
    )

@router.post("", response_model=BaseResource)
async def create_custom_deck(
    payload: CustomDeckCreateRequest,
    current_user: dict = Depends(deps.get_current_user),
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    user_id = current_user["sub"]
    
    # Use provided config or default to standard preset
    config_dict = payload.config.dict() if payload.config else CustomDeckConfig.from_preset(DeckConfigPreset.DEFAULT).dict()
    
    deck = await repo.create_custom_deck(
        user_id=user_id,
        name=payload.name,
        description=payload.description,
        config=config_dict
    )
    
    return BaseResource(
        id=deck["id"],
        object="custom_deck",
        url=f"/custom_decks/{deck['id']}",
        data_updated_at=deck["created_at"],
        data=deck
    )

@router.get("/{id}", response_model=BaseResource)
async def get_custom_deck(
    id: int,
    current_user: dict = Depends(deps.get_current_user),
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    user_id = current_user["sub"]
    deck = await repo.get_custom_deck(id, user_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Custom deck not found")
        
    return BaseResource(
        id=deck["id"],
        object="custom_deck",
        url=f"/custom_decks/{deck['id']}",
        data_updated_at=deck["data_updated_at"],
        data=deck
    )

@router.patch("/{id}", response_model=BaseResource)
async def update_custom_deck(
    id: int,
    payload: CustomDeckUpdateRequest,
    current_user: dict = Depends(deps.get_current_user),
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    user_id = current_user["sub"]
    updates = payload.dict(exclude_unset=True)
    if "config" in updates and updates["config"]:
        updates["config"] = updates["config"].dict()
        
    deck = await repo.update_custom_deck(id, user_id, updates)
    if not deck:
        raise HTTPException(status_code=404, detail="Custom deck not found")
        
    return BaseResource(
        id=deck["id"],
        object="custom_deck",
        url=f"/custom_decks/{deck['id']}",
        data_updated_at=deck["data_updated_at"],
        data=deck
    )

@router.delete("/{id}")
async def delete_custom_deck(
    id: int,
    current_user: dict = Depends(deps.get_current_user),
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    user_id = current_user["sub"]
    success = await repo.delete_custom_deck(id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Custom deck not found")
    return {"status": "success"}

# ── Deck Items ────────────────────────────────────────────────

@router.get("/{id}/items", response_model=BaseCollection)
async def list_custom_deck_items(
    id: int,
    current_user: dict = Depends(deps.get_current_user),
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    user_id = current_user["sub"]
    deck = await repo.get_custom_deck(id, user_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Custom deck not found")
        
    items = await repo.list_custom_deck_items(id)
    
    data = []
    for i in items:
        data.append(BaseResource(
            id=i["id"],
            object="custom_deck_item",
            url=f"/custom_decks/{id}/items/{i['subject_id']}",
            data_updated_at=i["created_at"],
            data=i
        ))
        
    return BaseCollection(
        object="collection",
        url=f"/custom_decks/{id}/items",
        total_count=len(data),
        data=data
    )

@router.post("/{id}/items", response_model=BaseCollection)
async def add_custom_deck_items(
    id: int,
    payload: CustomDeckAddItemsRequest,
    current_user: dict = Depends(deps.get_current_user),
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    user_id = current_user["sub"]
    deck = await repo.get_custom_deck(id, user_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Custom deck not found")
        
    items = await repo.add_custom_deck_items(id, payload.subject_ids, payload.custom_level or 1)
    
    data = []
    for i in items:
        data.append(BaseResource(
            id=i["id"],
            object="custom_deck_item",
            url=f"/custom_decks/{id}/items/{i['subject_id']}",
            data_updated_at=i["created_at"],
            data=i
        ))
        
    return BaseCollection(
        object="collection",
        url=f"/custom_decks/{id}/items",
        total_count=len(data),
        data=data
    )

@router.delete("/{id}/items/{subject_id}")
async def remove_custom_deck_item(
    id: int,
    subject_id: int,
    current_user: dict = Depends(deps.get_current_user),
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    user_id = current_user["sub"]
    deck = await repo.get_custom_deck(id, user_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Custom deck not found")
        
    success = await repo.remove_custom_deck_item(id, subject_id)
    if not success:
        raise HTTPException(status_code=404, detail="Item not found in deck")
    return {"status": "success"}

# ── Deck Review Queue ─────────────────────────────────────────

@router.get("/{id}/reviews", response_model=BaseCollection)
async def get_custom_deck_reviews(
    id: int,
    current_user: dict = Depends(deps.get_current_user),
    repo: WaniKaniRepository = Depends(deps.get_wanikani_repo)
):
    user_id = current_user["sub"]
    deck = await repo.get_custom_deck(id, user_id)
    if not deck:
        raise HTTPException(status_code=404, detail="Custom deck not found")
        
    reviews = await repo.get_custom_deck_reviews(id, user_id)
    
    data = []
    for r in reviews:
        # Use simple wrapper for the due items
        data.append({
            "subject_id": r["subject_id"],
            "subject_type": r["subject_type"],
            "srs_stage": r["srs_stage"],
            "effective_srs_stage": r["effective_srs_stage"],
            "available_at": r["available_at"]
        })
        
    return BaseCollection(
        object="collection",
        url=f"/custom_decks/{id}/reviews",
        total_count=len(data),
        data=data
    )
