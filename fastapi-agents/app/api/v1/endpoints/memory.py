from __future__ import annotations
from typing import Any, Dict
from supabase import Client
from app.api.deps import get_current_user
from fastapi import Depends
"""
Memory endpoints.
Fixes:
  Issue #1  — JWT authentication on all endpoints
  Issue #6  — run_in_threadpool for sync code
  Issue #14 — no raw exception strings in responses

Architecture Note:
  Auth removed from FastAPI per architecture rules.
  FastAPI = Agents ONLY (stateless, no auth)
  Auth handled by Supabase/Next.js (BFF pattern)
  user_id passed in request body/query from trusted Next.js layer
"""

import logging

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.concurrency import run_in_threadpool

from app.schemas.context import ContextRequest, ContextResponse
from app.schemas.memory import (
    EpisodicSearchRequest,
    EpisodicSearchResponse,
    AddEpisodicRequest,
    AddEpisodicResponse,
    SemanticSearchRequest,
    SemanticSearchResponse,
    AddSemanticRequest,
    AddSemanticResponse,
    ClearResponse,
)
from app.schemas.session import SessionMessage
from app.schemas.memory import UserProfile as UserProfileSchema
from app.services.memory import episodic_memory as ep_mem
from app.services.memory import semantic_memory as sem_mem
from app.agents.user_profile import build_user_profile, profile_to_system_prompt
from app.core.domain_client import DomainClient
from app.core.rate_limit import limiter
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/context", response_model=ContextResponse, tags=["Context"])
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def get_chat_context(
    request: Request,
    req: ContextRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Primary chatbot integration endpoint."""
    user_id = current_user["id"]
    if str(req.user_id) != str(user_id):
         raise HTTPException(status_code=400, detail="Invalid user_id in request body")
    try:
        ep_results = await run_in_threadpool(
            ep_mem.search_episodic_memory, user_id, req.query, req.max_episodic
        )
        ep_text = "\n".join(f"- {m.text}" for m in ep_results) or "(none)"

        keywords = [w for w in req.query.split() if len(w) > 3][:8]
        sem_results = await run_in_threadpool(
            sem_mem.search_semantic_memory, user_id, keywords
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

        profile = await run_in_threadpool(build_user_profile, user_id)
        profile_snippet = profile_to_system_prompt(profile)

        thread_msgs = []
        thread_text = ""
        if req.session_id:
            domain = DomainClient(current_user["jwt"])
            raw = await domain.get_chat_messages(req.session_id)
            thread_msgs = raw[-10:]
            
            recent = thread_msgs # use for context
            lines = []
            for m in recent:
                prefix = "User" if m["role"] == "user" else "Assistant"
                lines.append(f"{prefix}: {m['content']}")
            thread_text = "\n".join(lines)

        block = (
            f"## Memory Context for user '{user_id}'\n\n"
            f"### User Profile\n{profile_snippet}\n\n"
            f"### Relevant Past Conversations\n{ep_text}\n\n"
            f"### Known Facts (Knowledge Graph)\n{sem_text}"
        )
        if thread_text and thread_text != "(no active session)":
            block += f"\n\n### Current Thread\n{thread_text}"

        return ContextResponse(
            user_id=user_id,
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
        logger.error(
            "context_error",
            extra={"user_id": user_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Context retrieval failed")


@router.post(
    "/episodic/search", response_model=EpisodicSearchResponse, tags=["Episodic"]
)
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def search_episodic(
    request: Request,
    req: EpisodicSearchRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Search episodic memory."""
    user_id = current_user["id"]
    if str(req.user_id) != str(user_id):
          raise HTTPException(status_code=400, detail="Invalid user_id in request body")
    results = await run_in_threadpool(
        ep_mem.search_episodic_memory, user_id, req.query, req.k
    )
    return EpisodicSearchResponse(user_id=user_id, query=req.query, results=results)


@router.post("/episodic/add", response_model=AddEpisodicResponse, tags=["Episodic"])
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def add_episodic(
    request: Request,
    req: AddEpisodicRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Add episodic memory."""
    user_id = current_user["id"]
    if str(req.user_id) != str(user_id):
         raise HTTPException(status_code=400, detail="Invalid user_id in request body")
    pid = await run_in_threadpool(ep_mem.add_episodic_memory, user_id, req.text)
    return AddEpisodicResponse(user_id=user_id, text=req.text, id=pid)


@router.delete("/episodic/{memory_id}", response_model=ClearResponse, tags=["Episodic"])
async def forget_episodic(
    memory_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a specific episodic memory."""
    user_id = current_user["id"]
    try:
        await run_in_threadpool(ep_mem.delete_episodic_memory_by_id, memory_id)
    except Exception as exc:
        logger.error(
            "forget_episodic_error", extra={"memory_id": memory_id, "error": str(exc)}
        )
        raise HTTPException(status_code=500, detail="Failed to delete memory")
    return ClearResponse(user_id=user_id, message=f"Memory '{memory_id}' deleted.")


@router.delete("/episodic/clear", response_model=ClearResponse, tags=["Episodic"])
async def clear_episodic(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Clear all episodic memories for a user."""
    user_id = current_user["id"]
    await run_in_threadpool(ep_mem.clear_episodic_memory, user_id)
    return ClearResponse(
        user_id=user_id, message=f"All episodic memories cleared for '{user_id}'."
    )


@router.post(
    "/semantic/search", response_model=SemanticSearchResponse, tags=["Semantic"]
)
async def search_semantic(
    req: SemanticSearchRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Search semantic memory."""
    user_id = current_user["id"]
    if str(req.user_id) != str(user_id):
         raise HTTPException(status_code=400, detail="Invalid user_id in request body")
    keywords = [w for w in req.query.split() if len(w) > 2]
    results = await run_in_threadpool(
        sem_mem.search_semantic_memory, user_id, keywords
    )
    return SemanticSearchResponse(user_id=user_id, query=req.query, results=results)


@router.post("/semantic/add", response_model=AddSemanticResponse, tags=["Semantic"])
async def add_semantic(
    req: AddSemanticRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Add semantic memory nodes and relationships."""
    user_id = current_user["id"]
    if str(req.user_id) != str(user_id):
         raise HTTPException(status_code=400, detail="Invalid user_id in request body")
    n, r = await run_in_threadpool(
        sem_mem.add_nodes_and_relationships, user_id, req.nodes, req.relationships
    )
    return AddSemanticResponse(
        user_id=user_id, nodes_added=n, relationships_added=r
    )


@router.delete("/semantic/clear", response_model=ClearResponse, tags=["Semantic"])
async def clear_semantic(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Clear all semantic memory for a user."""
    user_id = current_user["id"]
    await run_in_threadpool(sem_mem.clear_semantic_memory, user_id)
    return ClearResponse(
        user_id=user_id, message=f"Semantic graph cleared for '{user_id}'."
    )


@router.get("/profile", response_model=UserProfileSchema, tags=["Profile"])
async def get_user_profile(
    current_user: Dict[str, Any] = Depends(get_current_user),
):
    """Get user profile."""
    user_id = current_user["id"]
    try:
        return await run_in_threadpool(build_user_profile, user_id)
    except Exception as exc:
        logger.error("profile_error", extra={"user_id": user_id, "error": str(exc)})
        raise HTTPException(status_code=500, detail="Profile retrieval failed")
