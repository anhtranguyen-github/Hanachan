"""SRS domain models — WaniKani stage system + custom deck config."""

from __future__ import annotations

from datetime import datetime
from enum import IntEnum, StrEnum

from pydantic import BaseModel, Field


# ── WaniKani SRS Stages ────────────────────────────────────────

class SRSStage(IntEnum):
    """WaniKani SRS stages (0-9)."""
    INITIATE = 0
    APPRENTICE_1 = 1
    APPRENTICE_2 = 2
    APPRENTICE_3 = 3
    APPRENTICE_4 = 4
    GURU_1 = 5
    GURU_2 = 6
    MASTER = 7
    ENLIGHTENED = 8
    BURNED = 9

    @property
    def label(self) -> str:
        labels = {
            0: "Initiate", 1: "Apprentice I", 2: "Apprentice II",
            3: "Apprentice III", 4: "Apprentice IV", 5: "Guru I",
            6: "Guru II", 7: "Master", 8: "Enlightened", 9: "Burned",
        }
        return labels.get(self.value, "Unknown")

    @property
    def category(self) -> str:
        if self.value == 0:
            return "initiate"
        if self.value <= 4:
            return "apprentice"
        if self.value <= 6:
            return "guru"
        if self.value == 7:
            return "master"
        if self.value == 8:
            return "enlightened"
        return "burned"


class DeckConfigPreset(StrEnum):
    """Deck learning speed presets."""
    DEFAULT = "default"
    RUSH = "rush"
    RELAXED = "relaxed"
    CUSTOM = "custom"


class CustomDeckConfig(BaseModel):
    """Configuration for a custom deck's learning parameters."""
    preset: DeckConfigPreset = DeckConfigPreset.DEFAULT
    srs_system_id: int = 1
    interval_multiplier: float = Field(1.0, ge=0.1, le=5.0)
    lessons_per_session: int = Field(5, ge=1, le=50)
    max_reviews_per_day: int | None = Field(None, ge=1, le=500)
    auto_advance_level: bool = True
    shuffle_reviews: bool = True

    @classmethod
    def from_preset(cls, preset: DeckConfigPreset) -> CustomDeckConfig:
        presets = {
            DeckConfigPreset.DEFAULT: {
                "srs_system_id": 1, "interval_multiplier": 1.0,
                "lessons_per_session": 5, "max_reviews_per_day": None,
            },
            DeckConfigPreset.RUSH: {
                "srs_system_id": 2, "interval_multiplier": 0.5,
                "lessons_per_session": 10, "max_reviews_per_day": 200,
            },
            DeckConfigPreset.RELAXED: {
                "srs_system_id": 3, "interval_multiplier": 1.5,
                "lessons_per_session": 3, "max_reviews_per_day": 50,
            },
        }
        params = presets.get(preset, {})
        return cls(preset=preset, **params)


# ── SRS State for Calculations ────────────────────────────────

class SRSState(BaseModel):
    """Internal SRS state for FSRS calculations."""
    stage: int = 0
    stability: float = 0.0
    difficulty: float = 5.0
    reps: int = 0
    lapses: int = 0


class ReviewResult(BaseModel):
    """Result of an SRS review calculation."""
    new_stage: int
    new_stability: float
    new_difficulty: float
    new_reps: int
    new_lapses: int
    next_review_at: datetime
    interval_seconds: int
