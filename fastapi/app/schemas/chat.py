"""
Chat request/response schemas.
"""

from __future__ import annotations

import uuid
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    user_id: str = Field(
        ...,
        description="User UUID — must match the authenticated token subject.",
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="Max 4000 characters (~1000 tokens).",
    )
    session_id: Optional[str] = Field(
        None,
        description="Session ID for thread continuity. If omitted, no session context is used.",
    )

    @field_validator("user_id")
    @classmethod
    def validate_user_id(cls, v: str) -> str:
        try:
            uuid.UUID(v)
        except ValueError:
            raise ValueError("user_id must be a valid UUID")
        return v

    @field_validator("message")
    @classmethod
    def sanitise_message(cls, v: str) -> str:
        # Strip null bytes that can corrupt PostgreSQL text columns
        return v.replace("\x00", "").strip()


class ChatResponse(BaseModel):
    user_id: str
    session_id: Optional[str] = None
    message: str
    response: str
    episodic_context: str = ""
    semantic_context: str = ""
    thread_context: str = ""  # messages from current session used as context
