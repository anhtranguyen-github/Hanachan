from __future__ import annotations

"""
Maintenance endpoints.
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.concurrency import run_in_threadpool

from app.api.deps import get_current_user
from app.core.rate_limit import limiter
from app.schemas.memory import (
    ClearResponse,
    ConsolidationResult,
    HealthResponse,
    Node,
    Relationship,
)
from app.services.memory import episodic_memory as ep_mem
from app.services.memory import semantic_memory as sem_mem
from app.services.memory.consolidation import consolidate_memories
from app.core.llm import make_embedding_model
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health", tags=["System"])
async def health_live():
    return {"status": "ok"}


@router.get("/health/detailed", response_model=HealthResponse, tags=["System"])
async def health_detailed(request: Request):
    degraded = getattr(request.app.state, "degraded_services", [])
    qdrant_status = await run_in_threadpool(ep_mem.health_check)
    neo4j_status = await run_in_threadpool(sem_mem.health_check)
    # Removing db_status since database access must be through Supabase now
    db_status = "ok"

    overall = "ok"
    if degraded or qdrant_status != "ok" or neo4j_status != "ok":
        overall = "degraded"

    return HealthResponse(
        status=overall,
        qdrant=qdrant_status,
        neo4j=neo4j_status,
        db=db_status,
        degraded=degraded,
    )


@router.post(
    "/memory/consolidate",
    response_model=ConsolidationResult,
    tags=["Maintenance"],
)
@limiter.limit("2/hour")
async def run_consolidation(
    request: Request,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    try:
        user_id = current_user["id"]
        return await run_in_threadpool(consolidate_memories, user_id)
    except Exception as exc:
        logger.error(
            "consolidation_error", extra={"user_id": current_user["id"], "error": str(exc)}
        )
        raise HTTPException(status_code=500, detail="Consolidation failed")


@router.post("/memory/test/seed", tags=["Maintenance"])
async def seed_test_data(
    current_user: dict[str, Any] = Depends(get_current_user),
):
    if current_user.get("email") not in settings.admin_emails:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user_id = current_user["id"]

    await run_in_threadpool(
        ep_mem.add_episodic_memory,
        user_id,
        "The user previously mentioned they are a software engineer living in Tokyo.",
    )
    await run_in_threadpool(
        ep_mem.add_episodic_memory,
        user_id,
        "The user is currently learning Japanese to pass the JLPT N2 exam.",
    )
    await run_in_threadpool(
        ep_mem.add_episodic_memory,
        user_id,
        "The user prefers learning through immersion and hates traditional textbooks.",
    )

    u_node = Node(
        id=user_id,
        type="User",
        properties={"name": "Alice" if "alice" in user_id.lower() else f"User-{user_id[:8]}"},
    )
    goal_node = Node(
        id="JLPT_N2",
        type="Exam",
        properties={"description": "Japanese Language Proficiency Test N2"},
    )
    city_node = Node(id="Tokyo", type="City")

    await run_in_threadpool(
        sem_mem.add_nodes_and_relationships,
        user_id,
        [u_node, goal_node, city_node],
        [
            Relationship(source=u_node, target=goal_node, type="STUDYING_FOR"),
            Relationship(source=u_node, target=city_node, type="LIVES_IN"),
        ],
    )

    return {
        "user_id": user_id,
        "message": "Sample episodic and semantic memories seeded successfully.",
    }


@router.delete("/memory/test/clear", response_model=ClearResponse, tags=["Maintenance"])
async def clear_test_data(
    current_user: dict[str, Any] = Depends(get_current_user),
):
    if current_user.get("email") not in settings.admin_emails:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user_id = current_user["id"]

    ep_count = await run_in_threadpool(ep_mem.clear_episodic_memory, user_id)
    await run_in_threadpool(sem_mem.clear_semantic_memory, user_id)

    return ClearResponse(
        cleared=True,
        message="User's test episodic memories cleared.",
        items_deleted=ep_count,
        user_id=user_id,
    )


@router.get("/health/llm", tags=["Maintenance"]) 
async def health_llm():
    """Lightweight LLM auth check. Returns 200 if OpenAI key works, 401 if auth fails."""
    if not settings.openai_api_key:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY not set")

    try:
        emb = make_embedding_model()
        # run in threadpool since the embedding client is sync
        await run_in_threadpool(emb.embed_documents, ["health-check"])
        return {"status": "ok"}
    except Exception as exc:
        msg = str(exc)
        if "401" in msg or "Incorrect API key" in msg or "invalid_api_key" in msg:
            raise HTTPException(status_code=401, detail=f"LLM auth failed: {msg}")
        raise HTTPException(status_code=502, detail=f"LLM request failed: {msg}")
