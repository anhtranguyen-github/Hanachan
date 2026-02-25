"""
Pydantic models for API request/response schemas and internal data structures.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Internal / LLM-structured-output models
# ---------------------------------------------------------------------------

class Node(BaseModel):
    id: str = Field(description="Unique identifier — a person's name, company ticker, or concept.")
    type: str = Field(description="Node type, e.g. 'User', 'Company', 'InvestmentPhilosophy'.")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Extra properties.")


class Relationship(BaseModel):
    source: Node = Field(description="Source node.")
    target: Node = Field(description="Target node.")
    type: str = Field(description="Relationship type, e.g. 'INTERESTED_IN', 'HAS_GOAL'.")
    properties: Dict[str, Any] = Field(default_factory=dict, description="Extra properties.")


class KnowledgeGraph(BaseModel):
    """Structured knowledge extracted from a conversation by the LLM."""
    relationships: List[Relationship] = Field(
        description="Relationships to add to the knowledge graph."
    )


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


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Context injection (chatbot integration)
# ---------------------------------------------------------------------------

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
    episodic_memories: List["EpisodicMemory"] = []
    semantic_facts: List[Dict[str, Any]] = []
    user_profile_snippet: str = ""
    thread_history: List[SessionMessage] = []


# ---------------------------------------------------------------------------
# Episodic memory
# ---------------------------------------------------------------------------

class EpisodicMemory(BaseModel):
    id: str
    text: str
    score: Optional[float] = None
    created_at: Optional[str] = None


class EpisodicSearchRequest(BaseModel):
    user_id: str
    query: str
    k: int = Field(default=3, ge=1, le=20)


class EpisodicSearchResponse(BaseModel):
    user_id: str
    query: str
    results: List[EpisodicMemory]


class AddEpisodicRequest(BaseModel):
    user_id: str
    text: str


class AddEpisodicResponse(BaseModel):
    user_id: str
    text: str
    id: str


class ForgetEpisodicRequest(BaseModel):
    user_id: str
    memory_id: str


# ---------------------------------------------------------------------------
# Semantic memory
# ---------------------------------------------------------------------------

class SemanticFact(BaseModel):
    source_id: str
    source_type: str
    relationship: str
    target_id: str
    target_type: str


class SemanticSearchRequest(BaseModel):
    user_id: str
    query: str


class SemanticSearchResponse(BaseModel):
    user_id: str
    query: str
    results: List[Dict[str, Any]]


class AddSemanticRequest(BaseModel):
    user_id: str
    nodes: List[Node]
    relationships: List[Relationship]


class AddSemanticResponse(BaseModel):
    user_id: str
    nodes_added: int
    relationships_added: int


# ---------------------------------------------------------------------------
# User Profile
# ---------------------------------------------------------------------------

class UserProfile(BaseModel):
    user_id: str
    name: Optional[str] = None
    preferences: List[str] = []
    goals: List[str] = []
    interests: List[str] = []
    facts: List[str] = []
    raw_triples: List[Dict[str, Any]] = []


# ---------------------------------------------------------------------------
# Consolidation
# ---------------------------------------------------------------------------

class ConsolidationResult(BaseModel):
    user_id: str
    memories_before: int
    memories_after: int
    batches_merged: int
    message: str


# ---------------------------------------------------------------------------
# Inspect & Clear
# ---------------------------------------------------------------------------

class MemoryInspectResponse(BaseModel):
    user_id: str
    episodic_memories: List[EpisodicMemory]
    semantic_graph: List[Dict[str, Any]]
    graph_schema: Optional[Dict[str, Any]] = None
    active_sessions: List[SessionSummary] = []


class ClearResponse(BaseModel):
    user_id: str
    message: str


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class HealthResponse(BaseModel):
    status: str
    qdrant: str
    neo4j: str


# Resolve forward reference
ContextResponse.model_rebuild()
