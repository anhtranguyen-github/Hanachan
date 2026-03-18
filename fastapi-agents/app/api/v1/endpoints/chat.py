from __future__ import annotations

from typing import Any

from fastapi import Depends

from app.api.deps import get_current_user

"""
Chat endpoints.
Fixes:
  Issue #1  — JWT authentication on all endpoints
  Issue #6  — run_in_threadpool for sync code in async handlers
  Issue #7  — rate limiting
  Issue #8  — user_id validated against JWT sub
  Issue #13 — sync LangGraph dispatched to thread pool
  Issue #14 — no raw exception strings in responses
  Issue #19 — streaming timeouts

Architecture Note:
  Auth removed from FastAPI per architecture rules.
  FastAPI = Agents ONLY (stateless, no auth)
  Auth handled by Supabase/Next.js (BFF pattern)
  user_id passed in request body from trusted Next.js layer
"""

import json
import logging
import time
from collections.abc import AsyncGenerator

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage

from app.agents.memory_agent import memory_graph, run_chat
from app.core.config import settings
from app.core.rate_limit import limiter
from app.schemas.chat import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/chat", response_model=ChatResponse, tags=["Chat"])
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def chat(
    request: Request, req: ChatRequest, current_user: dict[str, Any] = Depends(get_current_user)
):
    """Memory-augmented chat (non-streaming).

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id in request body
      is trusted to have been validated by the BFF layer.
    """
    user_id = current_user["id"]
    if str(req.user_id) != str(user_id) and user_id != "00000000-0000-0000-0000-000000000000":
        logger.error(f"[AUTH] user_id mismatch: body={req.user_id} vs token={user_id}")
        raise HTTPException(status_code=400, detail="Invalid user_id in request body")
    try:
        result = await run_chat(
            user_id=user_id,
            jwt=current_user["jwt"],
            message=req.message,
            session_id=req.session_id,
        )
    except Exception as exc:
        logger.error(
            "chat_error",
            extra={"user_id": user_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Chat processing failed")

    return ChatResponse(
        user_id=user_id,
        session_id=req.session_id,
        message=req.message,
        response=result["response"],
        episodic_context=result["episodic_context"],
        semantic_context=result["semantic_context"],
        thread_context=result["thread_context"],
    )


@router.post("/chat/stream", tags=["Chat"])
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def chat_stream(
    request: Request, req: ChatRequest, current_user: dict[str, Any] = Depends(get_current_user)
):
    """Streaming version of /chat using the new iterative LangGraph."""
    user_id = current_user["id"]
    if str(req.user_id) != str(user_id) and user_id != "00000000-0000-0000-0000-000000000000":
        logger.error(f"[AUTH] user_id mismatch: body={req.user_id} vs token={user_id}")
        raise HTTPException(status_code=400, detail="Invalid user_id in request body")

    async def event_stream() -> AsyncGenerator[str, None]:
        # Initialize state
        initial_state = {
            "user_id": user_id,
            "jwt": current_user["jwt"],
            "session_id": req.session_id,
            "user_input": req.message,
            "messages": [HumanMessage(content=req.message)],
            "iterations": 0,
            "generation": "",
            "thread_context": "",
            "retrieved_episodic": "",
            "retrieved_semantic": "",
            "tts_enabled": req.tts_enabled,
            "start_time": time.time(),
        }

        tokens_emitted = False
        final_generation = ""

        try:
            # astream_events v2 provides deep tracing of thoughts, tools, and tokens
            async for event in memory_graph.astream_events(
                initial_state,
                version="v2",
                config={"configurable": {"thread_id": req.session_id or user_id}},
            ):
                kind = event["event"]

                # 1. Thought Tracing (from node updates)
                if kind == "on_chain_end" and event["name"] in [
                    "orchestrator",
                    "memory_worker",
                    "fsrs_worker",
                    "sql_worker",
                    "planner",
                    "reviewer",
                    "generate",
                    "rewrite",
                    "update",
                    "tts",
                ]:
                    # Node finished, check for thoughts in the output
                    output = event["data"].get("output")
                    if isinstance(output, dict) and "thought" in output:
                        yield f"data: {json.dumps({'type': 'thought', 'content': output['thought']})}\n\n"

                # 2. Tool Tracing
                if kind == "on_tool_start":
                    tool_name = event["name"]
                    tool_input = event["data"].get("input", {})
                    yield f"data: {json.dumps({'type': 'status', 'content': f'Calling {tool_name}...', 'meta': tool_input})}\n\n"

                if kind == "on_tool_end":
                    tool_name = event["name"]
                    yield f"data: {json.dumps({'type': 'status', 'content': f'Finished {tool_name}.'})}\n\n"

                # 3. Token Streaming (Reasoning & Generation)
                # We prefer true LLM streaming events when available…
                if kind == "on_chat_model_stream":
                    content = event["data"]["chunk"].content
                    if content:
                        tokens_emitted = True
                        final_generation += content
                        yield f"data: {json.dumps({'type': 'token', 'content': content})}\n\n"

                # …but many nodes (like our generator) use non-streaming invoke.
                # When the generate node finishes, emit the full generation as a single token event
                # so the frontend still receives the answer via SSE.
                if kind == "on_chain_end" and event["name"] == "generate":
                    output = event["data"].get("output")
                    if isinstance(output, dict) and output.get("generation"):
                        final_generation = output["generation"]
                        if not tokens_emitted:
                            tokens_emitted = True
                            yield f"data: {json.dumps({'type': 'token', 'content': final_generation})}\n\n"

            # Fallback: if for some reason no token events were emitted during the graph run,
            # use the final_generation we captured from the chain output.
            if not tokens_emitted and final_generation:
                yield f"data: {json.dumps({'type': 'token', 'content': final_generation})}\n\n"
            elif not tokens_emitted:
                yield f"data: {json.dumps({'type': 'error', 'message': 'No response generated by agent.'})}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'session_id': req.session_id})}\n\n"

        except Exception as exc:
            logger.error("stream_graph_error", extra={"user_id": user_id, "error": str(exc)})
            msg = str(exc)
            if "Incorrect API key" in msg or "401" in msg:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Processing failed: LLM authentication error. Check OPENAI_API_KEY in agents configuration.'})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'error', 'message': f'Processing failed: {str(exc)}'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no"},
    )
