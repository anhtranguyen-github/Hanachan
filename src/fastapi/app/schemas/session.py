from typing import Any

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Session / Thread models
# ---------------------------------------------------------------------------


class SessionMessage(BaseModel):
    role: str  # 'user' | 'assistant' | 'system'
    content: str
    timestamp: str | None = None


class SessionInfo(BaseModel):
    """Full session data including message history."""

    session_id: str
    user_id: str
    title: str | None = None  # auto-generated after first exchange
    summary: str | None = None  # rolling summary, updated each turn
    created_at: str
    updated_at: str
    message_count: int
    messages: list[SessionMessage] = []
    metadata: dict[str, Any] = Field(default_factory=dict)


class SessionSummary(BaseModel):
    """Lightweight session listing item (no messages)."""

    session_id: str
    user_id: str
    title: str | None = None
    summary: str | None = None
    created_at: str
    updated_at: str
    message_count: int
    metadata: dict[str, Any] = Field(default_factory=dict)


class CreateSessionRequest(BaseModel):
    user_id: str
    metadata: dict[str, Any] | None = None


class CreateSessionResponse(BaseModel):
    session_id: str
    user_id: str
    title: str | None = None
    created_at: str


class UpdateSessionRequest(BaseModel):
    title: str | None = None
    metadata: dict[str, Any] | None = None


class EndSessionResponse(BaseModel):
    session_id: str
    user_id: str
    title: str | None = None
    summary: str | None = None
    message_count: int
    message: str
