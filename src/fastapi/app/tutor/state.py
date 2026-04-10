from __future__ import annotations
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timezone


class TutorStateMode(Enum):
    LEARNING = "learning"
    INTERACTING = "interacting"
    QUIZZING = "quizzing"
    IDLE = "idle"


@dataclass
class TutorSessionState:
    user_id: str
    mode: TutorStateMode = TutorStateMode.LEARNING
    lessons_delivered: int = 0
    current_batch_count: int = 0
    last_interaction_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    is_quiz_ready: bool = False
    understanding_indicators: list[int] = field(default_factory=list)  # Score or count

    def record_interaction(self):
        self.last_interaction_at = datetime.now(timezone.utc)

    def reset_batch(self):
        self.current_batch_count = 0
        self.is_quiz_ready = False

    @classmethod
    def from_dict(cls, data: dict) -> TutorSessionState:
        return cls(
            user_id=data.get("user_id", "default"),
            mode=TutorStateMode(data.get("tutor_mode", "idle")),
            lessons_delivered=data.get("lessons_delivered", 0),
            current_batch_count=data.get("current_batch_count", 0),
            last_interaction_at=datetime.fromtimestamp(data.get("last_interaction_at", 0), tz=timezone.utc),
            is_quiz_ready=data.get("is_quiz_ready", False),
            understanding_indicators=data.get("understanding_indicators", []),
        )

    def to_dict(self) -> dict:
        return {
            "tutor_mode": self.mode.value,
            "lessons_delivered": self.lessons_delivered,
            "current_batch_count": self.current_batch_count,
            "last_interaction_at": self.last_interaction_at.timestamp(),
            "is_quiz_ready": self.is_quiz_ready,
            "understanding_indicators": self.understanding_indicators,
        }
