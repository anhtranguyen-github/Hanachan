"""
WaniKani-style API response models.
All responses follow the WaniKani collection/resource wrapper pattern.
"""

from __future__ import annotations

from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, Field


# ── Base Wrappers ─────────────────────────────────────────────

class PagesInfo(BaseModel):
    """Pagination info for collections."""
    per_page: int = 500
    next_url: str | None = None
    previous_url: str | None = None


class BaseResource(BaseModel):
    """Single resource wrapper (WaniKani-style)."""
    id: int
    object: str
    url: str = ""
    data_updated_at: datetime | None = None
    data: dict | BaseModel


class BaseCollection(BaseModel):
    """Collection wrapper (WaniKani-style)."""
    object: str = "collection"
    url: str = ""
    pages: PagesInfo = Field(default_factory=PagesInfo)
    total_count: int = 0
    data_updated_at: datetime | None = None
    data: list = []


# ── Subject Types ─────────────────────────────────────────────

class SubjectType(StrEnum):
    RADICAL = "radical"
    KANJI = "kanji"
    VOCABULARY = "vocabulary"
    GRAMMAR = "grammar"


class MeaningEntry(BaseModel):
    meaning: str
    primary: bool = False
    accepted_answer: bool = True


class ReadingEntry(BaseModel):
    reading: str
    type: str = ""  # onyomi, kunyomi, nanori
    primary: bool = False
    accepted_answer: bool = True


class SubjectData(BaseModel):
    """Subject data (combines all subject types)."""
    auxiliary_meanings: list[MeaningEntry] = []
    characters: str | None = None
    created_at: datetime | None = None
    document_url: str | None = None
    hidden_at: datetime | None = None
    lesson_position: int = 0
    level: int
    meanings: list[MeaningEntry]
    meaning_mnemonic: str | None = None
    readings: list[ReadingEntry] = []
    reading_mnemonic: str | None = None
    slug: str
    spaced_repetition_system_id: int = 1
    # Type-specific fields
    component_subject_ids: list[int] = []
    amalgamation_subject_ids: list[int] = []
    visually_similar_subject_ids: list[int] = []
    meaning_hint: str | None = None
    reading_hint: str | None = None
    parts_of_speech: list[str] = []
    context_sentences: list[dict] = []
    pronunciation_audios: list[dict] = []
    # Grammar-specific
    structure: dict | None = None
    explanation: str | None = None
    jlpt: int | None = None


class SubjectResource(BaseModel):
    """Single subject response."""
    id: int
    object: str = "subject"
    url: str = ""
    data_updated_at: datetime | None = None
    data: SubjectData


# ── Assignment ────────────────────────────────────────────────

class AssignmentData(BaseModel):
    available_at: datetime | None = None
    burned_at: datetime | None = None
    created_at: datetime | None = None
    hidden: bool = False
    passed_at: datetime | None = None
    resurrected_at: datetime | None = None
    srs_stage: int = 0
    started_at: datetime | None = None
    subject_id: int
    subject_type: str
    unlocked_at: datetime | None = None


class AssignmentResource(BaseModel):
    id: int
    object: str = "assignment"
    url: str = ""
    data_updated_at: datetime | None = None
    data: AssignmentData


# ── Review ────────────────────────────────────────────────────

class ReviewCreateRequest(BaseModel):
    """POST /reviews request body."""
    assignment_id: int
    incorrect_meaning_answers: int = 0
    incorrect_reading_answers: int = 0


class ReviewData(BaseModel):
    assignment_id: int
    subject_id: int
    spaced_repetition_system_id: int | None = None
    starting_srs_stage: int
    ending_srs_stage: int
    incorrect_meaning_answers: int = 0
    incorrect_reading_answers: int = 0
    created_at: datetime | None = None


class ReviewResource(BaseModel):
    id: int
    object: str = "review"
    url: str = ""
    data_updated_at: datetime | None = None
    data: ReviewData


class ReviewCreateResponse(BaseModel):
    """Response for POST /reviews."""
    id: int
    object: str = "review"
    url: str = ""
    data_updated_at: datetime | None = None
    data: ReviewData
    resources_updated: dict = {}  # assignment data after update


# ── Review Statistics ─────────────────────────────────────────

class ReviewStatisticData(BaseModel):
    subject_id: int
    subject_type: str
    meaning_correct: int = 0
    meaning_incorrect: int = 0
    meaning_max_streak: int = 0
    meaning_current_streak: int = 0
    reading_correct: int = 0
    reading_incorrect: int = 0
    reading_max_streak: int = 0
    reading_current_streak: int = 0
    percentage_correct: int = 0
    hidden: bool = False
    created_at: datetime | None = None


# ── Study Material ────────────────────────────────────────────

class StudyMaterialData(BaseModel):
    subject_id: int
    subject_type: str
    meaning_note: str | None = None
    reading_note: str | None = None
    meaning_synonyms: list[str] = []
    hidden: bool = False
    created_at: datetime | None = None


class StudyMaterialCreateRequest(BaseModel):
    subject_id: int
    meaning_note: str | None = None
    reading_note: str | None = None
    meaning_synonyms: list[str] = []


# ── SRS System ────────────────────────────────────────────────

class SRSStageInfo(BaseModel):
    position: int
    interval: int | None = None
    interval_unit: str | None = None


class SRSSystemData(BaseModel):
    name: str
    description: str | None = None
    unlocking_stage_position: int = 0
    starting_stage_position: int = 1
    passing_stage_position: int = 5
    burning_stage_position: int = 9
    stages: list[SRSStageInfo] = []
    created_at: datetime | None = None


# ── Level Progression ─────────────────────────────────────────

class LevelProgressionData(BaseModel):
    level: int
    unlocked_at: datetime | None = None
    started_at: datetime | None = None
    passed_at: datetime | None = None
    completed_at: datetime | None = None
    abandoned_at: datetime | None = None
    created_at: datetime | None = None


# ── Summary ──────────────────────────────────────────────────

class SummaryLesson(BaseModel):
    available_at: datetime
    subject_ids: list[int]


class SummaryReview(BaseModel):
    available_at: datetime
    subject_ids: list[int]


class SummaryData(BaseModel):
    lessons: list[SummaryLesson] = []
    next_reviews_at: datetime | None = None
    reviews: list[SummaryReview] = []


# ── Custom Deck ───────────────────────────────────────────────

class CustomDeckConfigData(BaseModel):
    """Deck config in API responses."""
    preset: str = "default"
    srs_system_id: int = 1
    interval_multiplier: float = 1.0
    lessons_per_session: int = 5
    max_reviews_per_day: int | None = None
    auto_advance_level: bool = True
    shuffle_reviews: bool = True


class CustomDeckData(BaseModel):
    name: str
    description: str | None = None
    current_level: int = 1
    config: CustomDeckConfigData = Field(default_factory=CustomDeckConfigData)
    created_at: datetime | None = None


class CustomDeckCreateRequest(BaseModel):
    name: str
    description: str | None = None
    config: CustomDeckConfigData | None = None


class CustomDeckUpdateRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    config: CustomDeckConfigData | None = None


class CustomDeckItemData(BaseModel):
    deck_id: int
    subject_id: int
    custom_level: int = 1
    created_at: datetime | None = None


class CustomDeckAddItemsRequest(BaseModel):
    subject_ids: list[int]
    custom_level: int | None = None


class CustomDeckProgressData(BaseModel):
    deck_id: int
    subject_id: int
    custom_srs_stage: int = 0
    custom_next_review_at: datetime | None = None
    created_at: datetime | None = None


# ── User ──────────────────────────────────────────────────────

class UserData(BaseModel):
    id: str
    username: str | None = None
    level: int = 1
    profile_url: str | None = None
    started_at: datetime | None = None
    current_vacation_started_at: datetime | None = None
    subscription: dict = {}
    preferences: dict = {}
