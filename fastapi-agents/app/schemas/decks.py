from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DeckItemBase(BaseModel):
    item_id: UUID
    item_type: str


class DeckItemCreate(DeckItemBase):
    pass


class DeckItem(DeckItemBase):
    id: UUID
    deck_id: UUID
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DeckBase(BaseModel):
    name: str
    description: Optional[str] = None


class DeckCreate(DeckBase):
    pass


class Deck(DeckBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    items: List[DeckItem] = []

    model_config = ConfigDict(from_attributes=True)
