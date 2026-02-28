"""
Maintenance endpoints.
Fixes:
  Issue #1  — JWT authentication on all endpoints
  Issue #6  — run_in_threadpool for sync code
  Issue #7  — rate limiting on expensive endpoints
  Issue #12 — nuclear delete requires auth + ownership + confirmation + audit log
  Issue #16 — health endpoint reflects real-time service status
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.concurrency import run_in_threadpool

from ....schemas.memory import (
    ClearResponse,
    HealthResponse,
    ConsolidationResult,
    Node,
    Relationship,
)
from ....services.memory import episodic_memory as ep_mem
from ....services.memory import semantic_memory as sem_mem
from ....services.memory import session_memory as sess_mem
from ....services.memory.consolidation import consolidate_memories
from ....core.security import require_auth, require_own_user
from ....core.rate_limit import limiter
from ....core.database import check_db_health

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/health", tags=["System"])
async def health_live():
    """Basic liveness check - no auth required for load balancer health checks."""
    return {"status": "ok"}


@router.get("/health/detailed", response_model=HealthResponse, tags=["System"])
async def health_detailed(request: Request, token: dict = Depends(require_auth)):
    """Check connectivity to all backend services (real-time, not cached startup state).

    Requires authentication to prevent unauthorized access to internal service status.
    """
    degraded = getattr(request.app.state, "degraded_services", [])
    qdrant_status = await run_in_threadpool(ep_mem.health_check)
    neo4j_status = await run_in_threadpool(sem_mem.health_check)
    db_status = await run_in_threadpool(check_db_health)

    overall = "ok"
    if degraded or qdrant_status != "ok" or neo4j_status != "ok" or db_status != "ok":
        overall = "degraded"

    return HealthResponse(
        status=overall,
        qdrant=qdrant_status,
        neo4j=neo4j_status,
        db=db_status,
        degraded=degraded,
    )


@router.post(
    "/memory/consolidate/{user_id}",
    response_model=ConsolidationResult,
    tags=["Maintenance"],
)
@limiter.limit("2/hour")
async def run_consolidation(
    request: Request,
    user_id: str = Depends(require_own_user),
):
    """Merge older episodic memories into richer, compressed summaries.

    Rate-limited to 2 calls/hour per IP to prevent LLM cost amplification.
    """
    try:
        return await run_in_threadpool(consolidate_memories, user_id)
    except Exception as exc:
        logger.error(
            "consolidation_error", extra={"user_id": user_id, "error": str(exc)}
        )
        raise HTTPException(status_code=500, detail="Consolidation failed")


@router.post("/memory/test/seed/{user_id}", tags=["Maintenance"])
async def seed_test_data(
    user_id: str = Depends(require_own_user),
):
    """Seed a user with sample episodic and semantic memories for testing."""
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
        properties={"name": "Alice" if "alice" in user_id.lower() else "Test User"},
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
        "layer_counts": {
            "episodic": 3,
            "semantic_nodes": 3,
            "semantic_relationships": 2,
        },
    }


@router.delete(
    "/memory/clear/{user_id}",
    response_model=ClearResponse,
    tags=["Maintenance"],
)
@limiter.limit("1/day")
async def clear_all_memory(
    request: Request,
    user_id: str = Depends(require_own_user),
    confirm: str = Query(
        ...,
        description="Must equal 'DELETE_ALL_MY_DATA' to confirm the irreversible operation.",
    ),
):
    """**Nuclear option** — delete ALL memory (episodic, semantic, sessions) for a user.

    Requires:
    - Valid JWT (authenticated)
    - user_id matches JWT subject (ownership)
    - confirm query param = 'DELETE_ALL_MY_DATA'
    - Rate-limited to 1 call/day per IP
    """
    if confirm != "DELETE_ALL_MY_DATA":
        raise HTTPException(
            status_code=400,
            detail="Confirmation string required: pass ?confirm=DELETE_ALL_MY_DATA",
        )

    logger.warning(
        "nuclear_delete_initiated",
        extra={"user_id": user_id, "timestamp": datetime.now(timezone.utc).isoformat()},
    )

    await run_in_threadpool(ep_mem.clear_episodic_memory, user_id)
    await run_in_threadpool(sem_mem.clear_semantic_memory, user_id)
    await run_in_threadpool(sess_mem.delete_all_sessions, user_id)

    logger.warning(
        "nuclear_delete_executed",
        extra={"user_id": user_id, "timestamp": datetime.now(timezone.utc).isoformat()},
    )

    return ClearResponse(
        user_id=user_id,
        message=f"All memory (episodic, semantic, sessions) cleared for '{user_id}'.",
    )
