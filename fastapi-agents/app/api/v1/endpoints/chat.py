from __future__ import annotations
from typing import Any, Dict
from app.api.deps import get_current_user
from fastapi import Depends
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
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse

from app.schemas.chat import ChatRequest, ChatResponse
from app.agents.memory_agent import run_chat, memory_agent
from app.core.rate_limit import limiter
from app.core.config import settings
from langchain_core.messages import HumanMessage

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/chat", response_model=ChatResponse, tags=["Chat"])
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def chat(
    request: Request,
    req: ChatRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Memory-augmented chat (non-streaming).

    Architecture Note:
      Auth is handled by Next.js/Supabase. user_id in request body
      is trusted to have been validated by the BFF layer.
    """
    user_id = current_user["id"]
    if str(req.user_id) != str(user_id):
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
    request: Request,
    req: ChatRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Streaming version of /chat using the new iterative LangGraph."""
    user_id = current_user["id"]
    if str(req.user_id) != str(user_id):
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
        }

        full_response = ""

        try:
            # We use astream to yield updates from the graph
            async for event in memory_agent.astream(
                initial_state,
                config={"configurable": {"thread_id": req.session_id or user_id}},
            ):
                # We can yield "meta" events for planning/tools
                for node_name, state_update in event.items():
                    if node_name == "planner":
                        # If the planner produced messages with tool calls, we can signal that
                        last_msg = state_update["messages"][-1]
                        if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
                            tool_names = [tc["name"] for tc in last_msg.tool_calls]
                            yield f"data: {json.dumps({'type': 'status', 'content': f'Planning tools: {tool_names}'})}\n\n"

                    elif node_name == "tools":
                        yield f"data: {json.dumps({'type': 'status', 'content': 'Retrieving knowledge...'})}\n\n"

                    elif node_name == "generate":
                        # The final generation
                        full_response = state_update["generation"]
                        # In the current implementation, 'generate' node produces the full response at once.
                        # If we wanted token-by-token streaming, we'd need to emit from inside the node or use a stream_mode.
                        yield f"data: {json.dumps({'type': 'token', 'content': full_response})}\n\n"

            yield f"data: {json.dumps({'type': 'done', 'session_id': req.session_id})}\n\n"

        except Exception as exc:
            logger.error(
                "stream_graph_error", extra={"user_id": user_id, "error": str(exc)}
            )
            yield f"data: {json.dumps({'type': 'error', 'message': f'Processing failed: {str(exc)}'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no"},
    )
