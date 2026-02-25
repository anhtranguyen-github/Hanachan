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

class ClearResponse(BaseModel):
    user_id: str
    message: str


class HealthResponse(BaseModel):
    status: str
    qdrant: str
    neo4j: str
