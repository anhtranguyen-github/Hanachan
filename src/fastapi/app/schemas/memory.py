from typing import Any

from pydantic import BaseModel, ConfigDict, Field

# ---------------------------------------------------------------------------
# Internal / LLM-structured-output models
# ---------------------------------------------------------------------------


class Node(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(description="Unique identifier — a person's name (e.g. 'Alice'), or concept (e.g. 'ramen').")
    type: str = Field(description="Node type, e.g. 'User', 'Person', 'Food'.")


class Relationship(BaseModel):
    model_config = ConfigDict(extra="forbid")
    source: Node | str = Field(description="Source node or ID string.")
    target: Node | str = Field(description="Target node or ID string.")
    type: str = Field(description="Relationship type, e.g. 'LIKES', 'HAS_INTEREST'.")


class KnowledgeGraph(BaseModel):
    """Structured knowledge extracted from a conversation by the LLM."""

    model_config = ConfigDict(extra="forbid")
    relationships: list[Relationship] = Field(
        description="Relationships to add to the knowledge graph."
    )


# ---------------------------------------------------------------------------
# Episodic memory
# ---------------------------------------------------------------------------


class EpisodicMemory(BaseModel):
    id: str
    text: str
    score: float | None = None
    created_at: str | None = None


class EpisodicSearchRequest(BaseModel):
    user_id: str
    query: str
    k: int = Field(default=3, ge=1, le=20)


class EpisodicSearchResponse(BaseModel):
    user_id: str
    query: str
    results: list[EpisodicMemory]


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
    results: list[dict[str, Any]]


class AddSemanticRequest(BaseModel):
    user_id: str
    nodes: list[Node]
    relationships: list[Relationship]


class AddSemanticResponse(BaseModel):
    user_id: str
    nodes_added: int
    relationships_added: int


# ---------------------------------------------------------------------------
# User Profile
# ---------------------------------------------------------------------------


class UserProfile(BaseModel):
    user_id: str
    name: str | None = None
    preferences: list[str] = []
    goals: list[str] = []
    interests: list[str] = []
    facts: list[str] = []
    raw_triples: list[dict[str, Any]] = []


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
    db: str = "ok"
    degraded: list[str] = []
