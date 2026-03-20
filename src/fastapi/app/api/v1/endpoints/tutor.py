from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from app.api.deps import get_current_user
from app.agents.tutor_agent_mcp import TutorAgent


router = APIRouter()


class TutorChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message: str = Field(min_length=1)


class TutorChatResponse(BaseModel):
    reply: str
    tools: dict[str, Any] = Field(default_factory=dict)


@router.post("/agent/chat", response_model=TutorChatResponse, tags=["Tutor"])
async def tutor_chat(req: TutorChatRequest, current_user: dict[str, Any] = Depends(get_current_user)):
    agent = TutorAgent()
    result = await agent.respond(message=req.message, jwt=current_user["jwt"])
    return TutorChatResponse(reply=result["reply"], tools=result["tools"])

