from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel


class SRSStage(StrEnum):
    NEW = "new"
    LEARNING = "learning"
    REVIEW = "review"
    BURNED = "burned"


class Rating(StrEnum):
    AGAIN = "again"
    PASS = "pass"  # nosec B105


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
    last_review: datetime | None = None
    next_review: datetime | None = None
    # Catalog info
    character: str | None = None
    meaning: str | None = None
    notes: str | None = None


class LearningSummary(BaseModel):
    due_today: int
    learned_count: int
    burned_count: int
    new_items_count: int
    by_type: dict[str, dict[str, int]] = {}


class KnowledgeUnit(BaseModel):
    id: str
    type: str
    level: int
    character: str | None = None
    meaning: str
    slug: str
    metadata: dict = {}
