from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from app.api.deps import get_current_user
from app.agents.tutor_agent import run_chat


router = APIRouter()


class TutorChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message: str = Field(min_length=1)


class TutorChatResponse(BaseModel):
    reply: str
    tools: dict[str, Any] = Field(default_factory=dict)


@router.post("/agent/chat", response_model=TutorChatResponse, tags=["Tutor"])
async def tutor_chat(req: TutorChatRequest, current_user: dict[str, Any] = Depends(get_current_user)):
    result = await run_chat(
        user_id=current_user["id"],
        jwt=current_user["jwt"],
        message=req.message,
    )
    return TutorChatResponse(reply=result["response"], tools={})
