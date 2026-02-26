from fastapi import APIRouter, HTTPException, Query
from ....schemas.context import ContextRequest, ContextResponse
from ....schemas.memory import (
    EpisodicSearchRequest, EpisodicSearchResponse, AddEpisodicRequest, AddEpisodicResponse,
    SemanticSearchRequest, SemanticSearchResponse, AddSemanticRequest, AddSemanticResponse,
    ClearResponse, EpisodicMemory
)
from ....schemas.session import SessionMessage
from ....schemas.memory import UserProfile as UserProfileSchema
from ....services.memory import episodic_memory as ep_mem
from ....services.memory import semantic_memory as sem_mem
from ....services.memory import session_memory as sess_mem
from ....agents.user_profile import build_user_profile, profile_to_system_prompt

router = APIRouter()

@router.post("/context", response_model=ContextResponse, tags=["Context"])
async def get_chat_context(req: ContextRequest):
    """
    **Primary chatbot integration endpoint.**
    """
    try:
        ep_results = ep_mem.search_episodic_memory(
            req.user_id, req.query, k=req.max_episodic
        )
        ep_text = "\n".join(f"- {m.text}" for m in ep_results) or "(none)"

        keywords = [w for w in req.query.split() if len(w) > 3][:8]
        sem_results = sem_mem.search_semantic_memory(req.user_id, keywords)
        sem_text = (
            "\n".join(
                f"- ({r['node'].get('id')} [{r['node'].get('type')}])"
                f" —[{r['relationship']}]→ "
                f"({r['related'].get('id')} [{r['related'].get('type')}])"
                for r in sem_results[:8]
            )
            or "(none)"
        )

        profile = build_user_profile(req.user_id)
        profile_snippet = profile_to_system_prompt(profile)

        thread_msgs = []
        thread_text = ""
        if req.session_id:
            raw = sess_mem.get_messages(req.session_id)
            thread_msgs = raw[-10:]
            thread_text = sess_mem.get_thread_context_text(req.session_id, last_n=10)

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
                SessionMessage(role=m["role"], content=m["content"], timestamp=m.get("timestamp"))
                for m in thread_msgs
            ],
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

@router.post("/episodic/search", response_model=EpisodicSearchResponse, tags=["Episodic"])
async def search_episodic(req: EpisodicSearchRequest):
    results = ep_mem.search_episodic_memory(req.user_id, req.query, k=req.k)
    return EpisodicSearchResponse(user_id=req.user_id, query=req.query, results=results)

@router.post("/episodic/add", response_model=AddEpisodicResponse, tags=["Episodic"])
async def add_episodic(req: AddEpisodicRequest):
    pid = ep_mem.add_episodic_memory(req.user_id, req.text)
    return AddEpisodicResponse(user_id=req.user_id, text=req.text, id=pid)

@router.delete("/episodic/{memory_id}", response_model=ClearResponse, tags=["Episodic"])
async def forget_episodic(memory_id: str, user_id: str = Query(...)):
    try:
        from qdrant_client.http import models as qmodels
        client = ep_mem._get_client()
        client.delete(
            collection_name=settings.qdrant_collection,
            points_selector=qmodels.PointIdsList(points=[memory_id]),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return ClearResponse(user_id=user_id, message=f"Memory '{memory_id}' deleted.")

@router.delete("/episodic/clear", response_model=ClearResponse, tags=["Episodic"])
async def clear_episodic(user_id: str = Query(...)):
    ep_mem.clear_episodic_memory(user_id)
    return ClearResponse(user_id=user_id, message=f"All episodic memories cleared for '{user_id}'.")

@router.post("/semantic/search", response_model=SemanticSearchResponse, tags=["Semantic"])
async def search_semantic(req: SemanticSearchRequest):
    keywords = [w for w in req.query.split() if len(w) > 2]
    results = sem_mem.search_semantic_memory(req.user_id, keywords)
    return SemanticSearchResponse(user_id=req.user_id, query=req.query, results=results)

@router.post("/semantic/add", response_model=AddSemanticResponse, tags=["Semantic"])
async def add_semantic(req: AddSemanticRequest):
    n, r = sem_mem.add_nodes_and_relationships(req.user_id, req.nodes, req.relationships)
    return AddSemanticResponse(user_id=req.user_id, nodes_added=n, relationships_added=r)

@router.delete("/semantic/clear", response_model=ClearResponse, tags=["Semantic"])
async def clear_semantic(user_id: str = Query(...)):
    sem_mem.clear_semantic_memory(user_id)
    return ClearResponse(user_id=user_id, message=f"Semantic graph cleared for '{user_id}'.")

@router.get("/profile/{user_id}", response_model=UserProfileSchema, tags=["Profile"])
async def get_user_profile(user_id: str):
    try:
        return build_user_profile(user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
