from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Session / Thread models
# ---------------------------------------------------------------------------

class SessionMessage(BaseModel):
    role: str                         # 'user' | 'assistant' | 'system'
    content: str
    timestamp: Optional[str] = None


class SessionInfo(BaseModel):
    """Full session data including message history."""
    session_id: str
    user_id: str
    title: Optional[str] = None       # auto-generated after first exchange
    summary: Optional[str] = None     # rolling summary, updated each turn
    created_at: str
    updated_at: str
    message_count: int
    messages: List[SessionMessage] = []
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SessionSummary(BaseModel):
    """Lightweight session listing item (no messages)."""
    session_id: str
    user_id: str
    title: Optional[str] = None
    summary: Optional[str] = None
    created_at: str
    updated_at: str
    message_count: int
    metadata: Dict[str, Any] = Field(default_factory=dict)


class CreateSessionRequest(BaseModel):
    user_id: str
    metadata: Optional[Dict[str, Any]] = None


class CreateSessionResponse(BaseModel):
    session_id: str
    user_id: str
    title: Optional[str] = None
    created_at: str


class UpdateSessionRequest(BaseModel):
    title: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class EndSessionResponse(BaseModel):
    session_id: str
    user_id: str
    title: Optional[str] = None
    summary: Optional[str] = None
    message_count: int
    message: str
