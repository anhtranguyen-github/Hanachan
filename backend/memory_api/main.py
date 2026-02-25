"""
FastAPI Memory Modules Backend
==============================
Episodic + Semantic + Session memory stack for AI chatbot integration.

  Episodic  —  Qdrant (cloud vector store)
  Semantic  —  Neo4j  (cloud knowledge graph)
  Session   —  In-process thread buffer (working memory)
  LLM       —  OpenAI GPT-4o

Run:
    uv run uvicorn main:app --reload --port 8765
"""
from __future__ import annotations

import asyncio
import json
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from langchain_openai import ChatOpenAI

import episodic_memory as ep_mem
import semantic_memory as sem_mem
import session_memory as sess_mem
from consolidation import consolidate_memories
from memory_agent import run_chat
from config import settings
from models import (
    AddEpisodicRequest,
    AddEpisodicResponse,
    AddSemanticRequest,
    AddSemanticResponse,
    ChatRequest,
    ChatResponse,
    ClearResponse,
    ConsolidationResult,
    ContextRequest,
    ContextResponse,
    CreateSessionRequest,
    CreateSessionResponse,
    EndSessionResponse,
    EpisodicSearchRequest,
    EpisodicSearchResponse,
    ForgetEpisodicRequest,
    HealthResponse,
    MemoryInspectResponse,
    SemanticSearchRequest,
    SemanticSearchResponse,
    UpdateSessionRequest,
    UserProfile,
)
from user_profile import build_user_profile, profile_to_system_prompt


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[startup] Initialising Qdrant collection …")
    try:
        ep_mem.init_qdrant()
        print("[startup] Qdrant ready ✓")
    except Exception as exc:
        print(f"[startup] Qdrant init failed (skipping): {exc}")

    print("[startup] Initialising Neo4j indexes …")
    try:
        sem_mem.init_neo4j()
        print("[startup] Neo4j ready ✓")
    except Exception as exc:
        print(f"[startup] Neo4j init failed (skipping): {exc}")
    
    print("[startup] Lifespan complete ✓")
    yield
    print("[shutdown] Done.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Memory Modules API",
    description=(
        "Episodic + Semantic + Session memory backend for AI chatbots.\n\n"
        "**Memory layers**\n"
        "- **Session (Working Memory)**: in-thread conversation context, auto-titled and summarised\n"
        "- **Episodic**: Qdrant vector store — past turn summaries, recalled by similarity\n"
        "- **Semantic**: Neo4j knowledge graph — extracted entities and facts\n\n"
        "**Chatbot integration**: call `/memory/context` to get a ready-to-inject system prompt block."
    ),
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health():
    """Check connectivity to all backend services."""
    return HealthResponse(
        status="ok",
        qdrant=ep_mem.health_check(),
        neo4j=sem_mem.health_check(),
    )


# ===========================================================================
# SESSION (THREAD) ENDPOINTS
# ===========================================================================

@app.post("/memory/session", response_model=CreateSessionResponse, tags=["Session"])
async def create_session(req: CreateSessionRequest):
    """
    Start a new conversation thread for a user.
    Returns a `session_id` to pass in subsequent `/memory/chat` calls.
    The thread automatically receives a title after the first exchange.
    """
    session_id = sess_mem.create_session(req.user_id, req.metadata)
    s = sess_mem.get_session(session_id)
    return CreateSessionResponse(
        session_id=session_id,
        user_id=req.user_id,
        title=None,
        created_at=s["created_at"],
    )


@app.get("/memory/session/{session_id}", tags=["Session"])
async def get_session(session_id: str):
    """Get full session info including all messages, title, and rolling summary."""
    info = sess_mem.to_session_info(session_id)
    if info is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return info


@app.get("/memory/sessions/{user_id}", tags=["Session"])
async def list_sessions(user_id: str):
    """List all active sessions for a user (summaries only, no message bodies)."""
    return sess_mem.list_sessions(user_id)


@app.patch("/memory/session/{session_id}", tags=["Session"])
async def update_session(session_id: str, req: UpdateSessionRequest):
    """Manually update a session's title or metadata."""
    ok = sess_mem.update_session_meta(
        session_id, title=req.title, metadata=req.metadata
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Session not found")
    info = sess_mem.to_session_info(session_id)
    return info


@app.delete("/memory/session/{session_id}", response_model=EndSessionResponse, tags=["Session"])
async def end_session(
    session_id: str,
    consolidate: bool = Query(
        True,
        description="If true, the full session transcript is written to long-term episodic memory.",
    ),
):
    """
    End a session (thread). Optionally consolidates the transcript into
    long-term episodic memory before discarding the in-memory buffer.
    """
    data = sess_mem.end_session(session_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Session not found")

    user_id = data["user_id"]

    if consolidate and data["messages"]:
        # Write a final summary of the whole session as one episodic memory
        transcript = "\n".join(
            f"{m['role'].capitalize()}: {m['content']}"
            for m in data["messages"]
            if m["role"] != "system"
        )
        if transcript:
            summary_text = (
                f"[Session transcript] {data.get('summary') or transcript[:300]}"
            )
            ep_mem.add_episodic_memory(user_id, summary_text)

    return EndSessionResponse(
        session_id=session_id,
        user_id=user_id,
        title=data.get("title"),
        summary=data.get("summary"),
        message_count=len(data["messages"]),
        message="Session ended"
        + (" and consolidated into long-term memory." if consolidate else "."),
    )


# ===========================================================================
# CHAT
# ===========================================================================

@app.post("/memory/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(req: ChatRequest):
    """
    Memory-augmented chat.

    Pass `session_id` to maintain thread continuity within a conversation.
    The agent retrieves from all three memory layers:
      1. Current thread messages (session context)
      2. Similar past conversations (episodic / Qdrant)
      3. Structured user facts (semantic / Neo4j)

    After responding, it automatically:
      - Updates the session with the new exchange (triggers auto-title + rolling summary)
      - Stores a turn summary in Qdrant
      - Extracts entities/facts into Neo4j
    """
    try:
        result = run_chat(
            user_id=req.user_id,
            message=req.message,
            session_id=req.session_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return ChatResponse(
        user_id=req.user_id,
        session_id=req.session_id,
        message=req.message,
        response=result["response"],
        episodic_context=result["episodic_context"],
        semantic_context=result["semantic_context"],
        thread_context=result["thread_context"],
    )


@app.post("/memory/chat/stream", tags=["Chat"])
async def chat_stream(req: ChatRequest):
    """
    Streaming version of `/memory/chat` using Server-Sent Events.
    Memory retrieval and storage are fully async-compatible:
      - Memory is retrieved before streaming begins.
      - Memory is updated after the full response is assembled.

    **Usage (JavaScript)**:
    ```js
    const es = new EventSource('/memory/chat/stream');
    ```
    Or via fetch with ReadableStream.
    """
    async def event_stream() -> AsyncGenerator[str, None]:
        # ── 1. Retrieve all memory layers (non-streaming) ────────────────
        from memory_agent import retrieve_memory, update_memory, AgentState

        state: AgentState = {
            "user_id": req.user_id,
            "session_id": req.session_id,
            "user_input": req.message,
            "thread_context": "",
            "retrieved_episodic": "",
            "retrieved_semantic": "",
            "retrieved_memories": "",
            "generation": "",
        }
        try:
            retrieved = await asyncio.get_event_loop().run_in_executor(
                None, retrieve_memory, state
            )
            state.update(retrieved)
        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
            return

        # Send the memory context as the first event (optional metadata)
        yield f"data: {json.dumps({'type': 'context', 'episodic': state['retrieved_episodic'], 'semantic': state['retrieved_semantic'], 'thread': state['thread_context']})}\n\n"

        # ── 2. Stream the response token-by-token ────────────────────────
        from langchain_core.prompts import ChatPromptTemplate
        from memory_agent import _GENERATION_PROMPT

        llm_stream = ChatOpenAI(
            model=settings.llm_model,
            temperature=0,
            openai_api_key=settings.openai_api_key,
            streaming=True,
        )
        chain = _GENERATION_PROMPT | llm_stream
        full_response = ""
        try:
            async for chunk in chain.astream(
                {
                    "user_input": req.message,
                    "retrieved_memories": state["retrieved_memories"],
                }
            ):
                token = chunk.content
                full_response += token
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
            return

        # ── 3. Update memory (background, after stream) ──────────────────
        state["generation"] = full_response
        try:
            await asyncio.get_event_loop().run_in_executor(
                None, update_memory, state
            )
        except Exception as exc:
            print(f"[stream] memory update error: {exc}")

        yield f"data: {json.dumps({'type': 'done', 'session_id': req.session_id})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ===========================================================================
# CONTEXT INJECTION (chatbot integration helper)
# ===========================================================================

@app.post("/memory/context", response_model=ContextResponse, tags=["Context"])
async def get_chat_context(req: ContextRequest):
    """
    **Primary chatbot integration endpoint.**

    Returns a ready-to-use `system_prompt_block` that you prepend to your
    chatbot's system message before calling the LLM. No agent involved —
    pure retrieval only.

    ```python
    ctx = requests.post("/memory/context", json={...}).json()
    system_msg = ctx["system_prompt_block"] + "\\n\\n" + YOUR_BASE_SYSTEM_PROMPT
    ```
    """
    try:
        # Episodic
        ep_results = ep_mem.search_episodic_memory(
            req.user_id, req.query, k=req.max_episodic
        )
        ep_text = "\n".join(f"- {m.text}" for m in ep_results) or "(none)"

        # Semantic
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

        # User profile snippet
        from user_profile import build_user_profile, profile_to_system_prompt
        profile = build_user_profile(req.user_id)
        profile_snippet = profile_to_system_prompt(profile)

        # Thread context
        thread_msgs = []
        thread_text = ""
        if req.session_id:
            raw = sess_mem.get_messages(req.session_id)
            thread_msgs = raw[-10:]  # last 10 messages
            thread_text = sess_mem.get_thread_context_text(req.session_id, last_n=10)

        # Compose system prompt block
        block = (
            f"## Memory Context for user '{req.user_id}'\n\n"
            f"### User Profile\n{profile_snippet}\n\n"
            f"### Relevant Past Conversations\n{ep_text}\n\n"
            f"### Known Facts (Knowledge Graph)\n{sem_text}"
        )
        if thread_text and thread_text != "(no active session)":
            block += f"\n\n### Current Thread\n{thread_text}"

        from models import SessionMessage
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


# ===========================================================================
# EPISODIC MEMORY
# ===========================================================================

@app.post("/memory/episodic/search", response_model=EpisodicSearchResponse, tags=["Episodic"])
async def search_episodic(req: EpisodicSearchRequest):
    """Similarity-search episodic memories in Qdrant."""
    results = ep_mem.search_episodic_memory(req.user_id, req.query, k=req.k)
    return EpisodicSearchResponse(user_id=req.user_id, query=req.query, results=results)


@app.post("/memory/episodic/add", response_model=AddEpisodicResponse, tags=["Episodic"])
async def add_episodic(req: AddEpisodicRequest):
    """Manually add a text entry to Qdrant episodic memory."""
    pid = ep_mem.add_episodic_memory(req.user_id, req.text)
    return AddEpisodicResponse(user_id=req.user_id, text=req.text, id=pid)


@app.delete("/memory/episodic/{memory_id}", response_model=ClearResponse, tags=["Episodic"])
async def forget_episodic(memory_id: str, user_id: str = Query(...)):
    """
    Delete a specific episodic memory by ID (the `id` field from search results).
    Useful for 'right to be forgotten' flows.
    """
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


@app.delete("/memory/episodic/clear", response_model=ClearResponse, tags=["Episodic"])
async def clear_episodic(user_id: str = Query(...)):
    """Clear ALL episodic memories for a user."""
    ep_mem.clear_episodic_memory(user_id)
    return ClearResponse(user_id=user_id, message=f"All episodic memories cleared for '{user_id}'.")


# ===========================================================================
# SEMANTIC MEMORY
# ===========================================================================

@app.post("/memory/semantic/search", response_model=SemanticSearchResponse, tags=["Semantic"])
async def search_semantic(req: SemanticSearchRequest):
    """Keyword search in the Neo4j semantic graph."""
    keywords = [w for w in req.query.split() if len(w) > 2]
    results = sem_mem.search_semantic_memory(req.user_id, keywords)
    return SemanticSearchResponse(user_id=req.user_id, query=req.query, results=results)


@app.post("/memory/semantic/add", response_model=AddSemanticResponse, tags=["Semantic"])
async def add_semantic(req: AddSemanticRequest):
    """Manually add nodes and relationships to Neo4j."""
    n, r = sem_mem.add_nodes_and_relationships(req.user_id, req.nodes, req.relationships)
    return AddSemanticResponse(user_id=req.user_id, nodes_added=n, relationships_added=r)


@app.delete("/memory/semantic/clear", response_model=ClearResponse, tags=["Semantic"])
async def clear_semantic(user_id: str = Query(...)):
    """Clear all semantic graph data for a user."""
    sem_mem.clear_semantic_memory(user_id)
    return ClearResponse(user_id=user_id, message=f"Semantic graph cleared for '{user_id}'.")


# ===========================================================================
# USER PROFILE
# ===========================================================================

@app.get("/memory/profile/{user_id}", response_model=UserProfile, tags=["Profile"])
async def get_user_profile(user_id: str):
    """
    Build and return a structured user profile derived from the semantic graph.
    Useful for displaying a 'what we know about you' view in a chatbot UI.
    """
    try:
        return build_user_profile(user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ===========================================================================
# CONSOLIDATION
# ===========================================================================

@app.post("/memory/consolidate/{user_id}", response_model=ConsolidationResult, tags=["Maintenance"])
async def run_consolidation(user_id: str):
    """
    Merge older episodic memories into richer, compressed summaries.
    Run periodically to prevent memory bloat (e.g. after every 20 sessions).
    """
    try:
        return consolidate_memories(user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ===========================================================================
# INSPECT (full snapshot)
# ===========================================================================

@app.get("/memory/inspect/{user_id}", response_model=MemoryInspectResponse, tags=["Inspect"])
async def inspect_memory(user_id: str):
    """
    Full memory snapshot for a user: episodic store, semantic graph, active sessions.
    Useful for debugging or building a 'memory manager' UI.
    """
    try:
        episodic = ep_mem.list_episodic_memories(user_id, limit=50)
        semantic = sem_mem.inspect_semantic_memory(user_id)
        schema = sem_mem.get_graph_schema()
        sessions = sess_mem.list_sessions(user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return MemoryInspectResponse(
        user_id=user_id,
        episodic_memories=episodic,
        semantic_graph=semantic,
        graph_schema=schema,
        active_sessions=sessions,
    )


# ===========================================================================
# TEST UTILS
# ===========================================================================

@app.post("/memory/test/seed/{user_id}", tags=["Maintenance"])
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
    from models import Node, Relationship
    
    # User node
    u_node = Node(id=user_id, type="User", properties={"name": "Alice" if "alice" in user_id.lower() else "Test User"})
    # Target node
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


# ===========================================================================
# CLEAR ALL
# ===========================================================================

@app.delete("/memory/clear/{user_id}", response_model=ClearResponse, tags=["Maintenance"])
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
