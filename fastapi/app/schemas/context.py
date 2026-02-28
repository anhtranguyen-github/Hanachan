from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from .session import SessionMessage, SessionSummary
from .memory import EpisodicMemory


class ContextRequest(BaseModel):
    user_id: str
    query: str
    session_id: Optional[str] = None
    max_episodic: int = Field(default=3, ge=1, le=10)


class ContextResponse(BaseModel):
    """
    Ready-to-inject context block for a chatbot system prompt.
    Concatenate `system_prompt_block` before your system message.
    """

    user_id: str
    query: str
    system_prompt_block: str
    episodic_memories: List[EpisodicMemory] = []
    semantic_facts: List[Dict[str, Any]] = []
    user_profile_snippet: str = ""
    thread_history: List[SessionMessage] = []


class MemoryInspectResponse(BaseModel):
    user_id: str
    episodic_memories: List[EpisodicMemory]
    semantic_graph: List[Dict[str, Any]]
    graph_schema: Optional[Dict[str, Any]] = None
    active_sessions: List[SessionSummary] = []


# Resolve forward reference
ContextResponse.model_rebuild()
