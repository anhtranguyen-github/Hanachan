import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.agents.reading_creator import (
    generate_reading_session,
    get_user_learning_context,
)
from app.api.deps import get_current_user
from app.core.core_client import CoreClient
from app.core.rate_limit import limiter

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/reading", tags=["Reading"])


class ReadingConfigUpdate(BaseModel):
    exercises_per_session: int | None = Field(None, ge=1, le=20)
    # ... other fields if needed for override
    difficulty_level: str | None = None
    topic_preferences: list[str] | None = None


class CreateSessionRequest(BaseModel):
    config_override: dict[str, Any] | None = None
    topics: list[str] | None = None


@router.post("/sessions")
@limiter.limit("5/minute")
async def create_reading_session(
    request: Request,
    body: CreateSessionRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """
    Pure Agent Runtime version of Session Creation.
    1. Fetches config from Core.
    2. Fetches learning context from Core.
    3. Generates content via LLM Agents.
    4. Persists results back to Core.
    """
    user_id = current_user["id"]
    jwt = current_user["jwt"]
    client = CoreClient(jwt)

    # 1. Get Config from Core
    try:
        config_data = await client._get("/reading/config")
    except Exception:
        # Fallback to defaults if core not ready
        config_data = {
            "exercises_per_session": 5,
            "difficulty_level": "adaptive",
            "topic_preferences": ["daily_life", "culture", "nature"],
        }

    if body.config_override:
        config_data.update(body.config_override)

    # 2. Get Learning Context from Core
    await get_user_learning_context(jwt)

    # 3. Generate content via Agent
    logger.info(f"Generating exercises for user {user_id}")
    # generate_reading_session is now async
    exercises = await generate_reading_session(user_id, config_data, jwt)

    # 4. Persist to Core
    # We send the whole payload to Core to handle persistence in one go
    # (assuming Core has an endpoint to accept a pre-generated session)
    payload = {"user_id": user_id, "config_snapshot": config_data, "exercises": exercises}

    try:
        result = await client._post("/reading/sessions/generated", payload)
        return result
    except Exception as e:
        logger.error(f"Failed to persist generated session to Core: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to save generated content to Core Service"
        )
