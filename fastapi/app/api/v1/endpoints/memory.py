"""
Memory endpoints.
Fixes:
  Issue #1  — JWT authentication on all endpoints
  Issue #6  — run_in_threadpool for sync code
  Issue #14 — no raw exception strings in responses
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.concurrency import run_in_threadpool

from ....schemas.context import ContextRequest, ContextResponse
from ....schemas.memory import (
    EpisodicSearchRequest,
    EpisodicSearchResponse,
    AddEpisodicRequest,
    AddEpisodicResponse,
    SemanticSearchRequest,
    SemanticSearchResponse,
    AddSemanticRequest,
    AddSemanticResponse,
    ClearResponse,
    EpisodicMemory,
)
from ....schemas.session import SessionMessage
from ....schemas.memory import UserProfile as UserProfileSchema
from ....services.memory import episodic_memory as ep_mem
from ....services.memory import semantic_memory as sem_mem
from ....services.memory import session_memory as sess_mem
from ....agents.user_profile import build_user_profile, profile_to_system_prompt
from ....core.security import require_auth, require_own_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/context", response_model=ContextResponse, tags=["Context"])
async def get_chat_context(
    req: ContextRequest,
    token: dict = Depends(require_auth),
):
    """Primary chatbot integration endpoint."""
    # Ownership: user can only fetch their own context
    if req.user_id != token.get("sub") and token.get("role") != "service_role":
        raise HTTPException(status_code=403, detail="Forbidden")

    try:
        ep_results = await run_in_threadpool(
            ep_mem.search_episodic_memory, req.user_id, req.query, req.max_episodic
        )
        ep_text = "\n".join(f"- {m.text}" for m in ep_results) or "(none)"

        keywords = [w for w in req.query.split() if len(w) > 3][:8]
        sem_results = await run_in_threadpool(
            sem_mem.search_semantic_memory, req.user_id, keywords
        )
        sem_text = (
            "\n".join(
                f"- ({r['node'].get('id')} [{r['node'].get('type')}])"
                f" —[{r['relationship']}]→ "
                f"({r['related'].get('id')} [{r['related'].get('type')}])"
                for r in sem_results[:8]
            )
            or "(none)"
        )

        profile = await run_in_threadpool(build_user_profile, req.user_id)
        profile_snippet = profile_to_system_prompt(profile)

        thread_msgs = []
        thread_text = ""
        if req.session_id:
            raw = await run_in_threadpool(sess_mem.get_messages, req.session_id)
            thread_msgs = raw[-10:]
            thread_text = await run_in_threadpool(
                sess_mem.get_thread_context_text, req.session_id, 10
            )

        block = (
            f"## Memory Context for user '{req.user_id}'\n\n"
            f"### User Profile\n{profile_snippet}\n\n"
            f"### Relevant Past Conversations\n{ep_text}\n\n"
            f"### Known Facts (Knowledge Graph)\n{sem_text}"
        )
        if thread_text and thread_text != "(no active session)":
            block += f"\n\n### Current Thread\n{thread_text}"

        return ContextResponse(
            user_id=req.user_id,
            query=req.query,
            system_prompt_block=block,
            episodic_memories=ep_results,
            semantic_facts=sem_results,
            user_profile_snippet=profile_snippet,
            thread_history=[
                SessionMessage(
                    role=m["role"],
                    content=m["content"],
                    timestamp=m.get("timestamp"),
                )
                for m in thread_msgs
            ],
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("context_error", extra={"user_id": req.user_id, "error": str(exc)}, exc_info=True)
        raise HTTPException(status_code=500, detail="Context retrieval failed")


@router.post("/episodic/search", response_model=EpisodicSearchResponse, tags=["Episodic"])
async def search_episodic(
    req: EpisodicSearchRequest,
    token: dict = Depends(require_auth),
):
    if req.user_id != token.get("sub") and token.get("role") != "service_role":
        raise HTTPException(status_code=403, detail="Forbidden")
    results = await run_in_threadpool(ep_mem.search_episodic_memory, req.user_id, req.query, req.k)
    return EpisodicSearchResponse(user_id=req.user_id, query=req.query, results=results)


@router.post("/episodic/add", response_model=AddEpisodicResponse, tags=["Episodic"])
async def add_episodic(
    req: AddEpisodicRequest,
    token: dict = Depends(require_auth),
):
    if req.user_id != token.get("sub") and token.get("role") != "service_role":
        raise HTTPException(status_code=403, detail="Forbidden")
    pid = await run_in_threadpool(ep_mem.add_episodic_memory, req.user_id, req.text)
    return AddEpisodicResponse(user_id=req.user_id, text=req.text, id=pid)


@router.delete("/episodic/{memory_id}", response_model=ClearResponse, tags=["Episodic"])
async def forget_episodic(
    memory_id: str,
    user_id: str = Query(...),
    token: dict = Depends(require_auth),
):
    if user_id != token.get("sub") and token.get("role") != "service_role":
        raise HTTPException(status_code=403, detail="Forbidden")
    try:
        await run_in_threadpool(
            ep_mem.delete_episodic_memory_by_id, memory_id
        )
    except Exception as exc:
        logger.error("forget_episodic_error", extra={"memory_id": memory_id, "error": str(exc)})
        raise HTTPException(status_code=500, detail="Failed to delete memory")
    return ClearResponse(user_id=user_id, message=f"Memory '{memory_id}' deleted.")


@router.delete("/episodic/clear", response_model=ClearResponse, tags=["Episodic"])
async def clear_episodic(
    user_id: str = Depends(require_own_user),
):
    await run_in_threadpool(ep_mem.clear_episodic_memory, user_id)
    return ClearResponse(user_id=user_id, message=f"All episodic memories cleared for '{user_id}'.")


@router.post("/semantic/search", response_model=SemanticSearchResponse, tags=["Semantic"])
async def search_semantic(
    req: SemanticSearchRequest,
    token: dict = Depends(require_auth),
):
    if req.user_id != token.get("sub") and token.get("role") != "service_role":
        raise HTTPException(status_code=403, detail="Forbidden")
    keywords = [w for w in req.query.split() if len(w) > 2]
    results = await run_in_threadpool(sem_mem.search_semantic_memory, req.user_id, keywords)
    return SemanticSearchResponse(user_id=req.user_id, query=req.query, results=results)


@router.post("/semantic/add", response_model=AddSemanticResponse, tags=["Semantic"])
async def add_semantic(
    req: AddSemanticRequest,
    token: dict = Depends(require_auth),
):
    if req.user_id != token.get("sub") and token.get("role") != "service_role":
        raise HTTPException(status_code=403, detail="Forbidden")
    n, r = await run_in_threadpool(
        sem_mem.add_nodes_and_relationships, req.user_id, req.nodes, req.relationships
    )
    return AddSemanticResponse(user_id=req.user_id, nodes_added=n, relationships_added=r)


@router.delete("/semantic/clear", response_model=ClearResponse, tags=["Semantic"])
async def clear_semantic(
    user_id: str = Depends(require_own_user),
):
    await run_in_threadpool(sem_mem.clear_semantic_memory, user_id)
    return ClearResponse(user_id=user_id, message=f"Semantic graph cleared for '{user_id}'.")


@router.get("/profile/{user_id}", response_model=UserProfileSchema, tags=["Profile"])
async def get_user_profile(
    user_id: str = Depends(require_own_user),
):
    try:
        return await run_in_threadpool(build_user_profile, user_id)
    except Exception as exc:
        logger.error("profile_error", extra={"user_id": user_id, "error": str(exc)})
        raise HTTPException(status_code=500, detail="Profile retrieval failed")
