from datetime import datetime
from enum import StrEnum
from pydantic import BaseModel

class SRSStage(StrEnum):
    NEW = "new"
    LEARNING = "learning"
    REVIEW = "review"
    RELEARNING = "relearning"
    BURNED = "burned"

class Rating(StrEnum):
    AGAIN = "again"
    HARD = "hard"
    GOOD = "good"
    PASS = "pass"  # Alias for GOOD
    EASY = "easy"

class ReviewSubmission(BaseModel):
    ku_id: str
    facet: str
    rating: Rating
    wrong_count: int = 0

class NoteSubmission(BaseModel):
    ku_id: str
    note_content: str

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

class ForecastItem(BaseModel):
    time: str
    count: int

class DailyForecastItem(BaseModel):
    date: str
    count: int

class Forecast(BaseModel):
    hourly: list[ForecastItem]
    daily: list[DailyForecastItem]
    total: int

class TypeMastery(BaseModel):
    radical: int
    kanji: int
    vocabulary: int
    grammar: int

class DashboardStats(BaseModel):
    reviewsDue: int
    dueBreakdown: dict[str, int]
    totalLearned: int
    totalMastered: int
    totalBurned: int
    recentLevels: list[int] = []
    retention: float
    minutesSpent: int
    reviewsToday: int
    actionFrequencies: dict[str, int]
    dailyReviews: list[int]
    forecast: Forecast
    heatmap: dict[str, int]
    typeMastery: TypeMastery
    srsSpread: dict[str, int]
    totalKUCoverage: float
    streak: int
    todayBatchCount: int = 0
    deckId: str | None = None

class Deck(BaseModel):
    id: str
    user_id: str | None = None
    name: str
    description: str | None = None
    is_system: bool = False
    created_at: datetime = datetime.utcnow()

class DeckProgress(BaseModel):
    deck_id: str
    total_items: int
    learned_items: int
    due_items: int
    retention: float
    progress_percentage: float

class UserDeckSettings(BaseModel):
    user_id: str
    deck_id: str
    is_enabled: bool = True
    updated_at: datetime = datetime.utcnow()
