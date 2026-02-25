from typing import Optional
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    user_id: str = Field(..., description="User namespace for long-term memory.")
    message: str = Field(..., description="User message.")
    session_id: Optional[str] = Field(
        None,
        description="Session ID for thread continuity. If omitted, no session context is used.",
    )


class ChatResponse(BaseModel):
    user_id: str
    session_id: Optional[str] = None
    message: str
    response: str
    episodic_context: str = ""
    semantic_context: str = ""
    thread_context: str = ""          # messages from current session used as context
