from datetime import datetime
from enum import Enum
from typing import Dict, Optional

from pydantic import BaseModel


class SRSStage(str, Enum):
    NEW = "new"
    LEARNING = "learning"
    REVIEW = "review"
    BURNED = "burned"


class Rating(str, Enum):
    AGAIN = "again"
    PASS = "pass"


class SRSState(BaseModel):
    stage: SRSStage = SRSStage.NEW
    stability: float = 0.1
    difficulty: float = 3.0
    reps: int = 0
    lapses: int = 0


class KUStatus(BaseModel):
    user_id: str
    item_id: str
    item_type: str = "ku"
    facet: str
    state: SRSStage
    stability: float
    difficulty: float
    reps: int
    lapses: int
    last_review: Optional[datetime] = None
    next_review: Optional[datetime] = None
    # Catalog info
    character: Optional[str] = None
    meaning: Optional[str] = None
    notes: Optional[str] = None


class LearningSummary(BaseModel):
    due_today: int
    learned_count: int
    burned_count: int
    new_items_count: int
    by_type: Dict[str, Dict[str, int]] = {}


class KnowledgeUnit(BaseModel):
    id: str
    type: str
    level: int
    character: Optional[str] = None
    meaning: str
    slug: str
    metadata: Dict = {}
