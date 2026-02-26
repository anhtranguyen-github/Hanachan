from fastapi import APIRouter, Query, HTTPException
from ....schemas.memory import ClearResponse, HealthResponse, ConsolidationResult, Node, Relationship
from ....services.memory import episodic_memory as ep_mem
from ....services.memory import semantic_memory as sem_mem
from ....services.memory import session_memory as sess_mem
from ....services.memory.consolidation import consolidate_memories

router = APIRouter()

@router.get("/health", response_model=HealthResponse, tags=["System"])
async def health():
    """Check connectivity to all backend services."""
    return HealthResponse(
        status="ok",
        qdrant=ep_mem.health_check(),
        neo4j=sem_mem.health_check(),
    )

@router.post("/memory/consolidate/{user_id}", response_model=ConsolidationResult, tags=["Maintenance"])
async def run_consolidation(user_id: str):
    """
    Merge older episodic memories into richer, compressed summaries.
    Run periodically to prevent memory bloat (e.g. after every 20 sessions).
    """
    try:
        return consolidate_memories(user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.post("/memory/test/seed/{user_id}", tags=["Maintenance"])
async def seed_test_data(user_id: str):
    """
    Seed a user with sample episodic and semantic memories for testing.
    This helps verify that the agent can actually recall and use persistent data.
    """
    # 1. Add Episodic Memories
    ep_mem.add_episodic_memory(
        user_id, 
        "The user previously mentioned they are a software engineer living in Tokyo."
    )
    ep_mem.add_episodic_memory(
        user_id, 
        "The user is currently learning Japanese to pass the JLPT N2 exam."
    )
    ep_mem.add_episodic_memory(
        user_id, 
        "The user prefers learning through immersion and hates traditional textbooks."
    )

    # 2. Add Semantic Facts
    u_node = Node(id=user_id, type="User", properties={"name": "Alice" if "alice" in user_id.lower() else "Test User"})
    goal_node = Node(id="JLPT_N2", type="Exam", properties={"description": "Japanese Language Proficiency Test N2"})
    city_node = Node(id="Tokyo", type="City")
    
    sem_mem.add_nodes_and_relationships(
        user_id,
        [u_node, goal_node, city_node],
        [
            Relationship(source=u_node, target=goal_node, type="STUDYING_FOR"),
            Relationship(source=u_node, target=city_node, type="LIVES_IN")
        ]
    )

    return {
        "user_id": user_id,
        "message": "Sample episodic and semantic memories seeded successfully.",
        "layer_counts": {
            "episodic": 3,
            "semantic_nodes": 3,
            "semantic_relationships": 2
        }
    }

@router.delete("/memory/clear/{user_id}", response_model=ClearResponse, tags=["Maintenance"])
async def clear_all_memory(user_id: str):
    """
    **Nuclear option** — delete ALL memory (episodic, semantic, sessions) for a user.
    Irreversible.
    """
    ep_mem.clear_episodic_memory(user_id)
    sem_mem.clear_semantic_memory(user_id)
    sess_mem.delete_all_sessions(user_id)
    return ClearResponse(
        user_id=user_id,
        message=f"All memory (episodic, semantic, sessions) cleared for '{user_id}'.",
    )
