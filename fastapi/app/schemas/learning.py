from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from datetime import datetime


class KUStatus(BaseModel):
    ku_id: str
    slug: str
    type: str
    character: str
    meaning: str
    level: int
    state: str = "new"  # 'new', 'reviewing', 'learned', etc.
    next_review: Optional[datetime] = None
    last_review: Optional[datetime] = None
    stability: float = 0.0
    difficulty: float = 5.0
    reps: int = 0
    lapses: int = 0
    notes: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class UserLearningSummary(BaseModel):
    user_id: str
    total_kus: int
    learned_count: int
    reviewing_count: int
    new_count: int
    level_stats: Dict[int, Dict[str, int]] = Field(default_factory=dict)
