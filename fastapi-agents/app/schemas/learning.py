from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class KUStatus(BaseModel):
    ku_id: str
    slug: str
    type: str
    character: str
    meaning: str
    level: int
    state: str = "new"  # 'new', 'reviewing', 'learned', etc.
    next_review: datetime | None = None
    last_review: datetime | None = None
    stability: float = 0.0
    difficulty: float = 5.0
    reps: int = 0
    lapses: int = 0
    notes: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class UserLearningSummary(BaseModel):
    user_id: str
    total_kus: int
    learned_count: int
    reviewing_count: int
    new_count: int
    level_stats: dict[int, dict[str, int]] = Field(default_factory=dict)
