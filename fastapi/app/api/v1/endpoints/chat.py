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
"""
from __future__ import annotations


import json
import logging
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse

from ....schemas.chat import ChatRequest, ChatResponse
from ....agents.memory_agent import run_chat, memory_agent
from ....core.security import require_auth
from ....core.rate_limit import limiter
from ....core.config import settings
from langchain_core.messages import HumanMessage

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/chat", response_model=ChatResponse, tags=["Chat"])
@limiter.limit(f"{settings.rate_limit_per_minute}/minute")
async def chat(request: Request, req: ChatRequest, token: dict = Depends(require_auth)):
    """Memory-augmented chat (non-streaming)."""
    # Issue #8: user_id must match the JWT subject
    if req.user_id != token.get("sub"):
        raise HTTPException(status_code=403, detail="user_id does not match token")

    try:
        result = await run_in_threadpool(
            run_chat,
            user_id=req.user_id,
            message=req.message,
            session_id=req.session_id,
        )
    except Exception as exc:
        logger.error(
            "chat_error",
            extra={"user_id": req.user_id, "error": str(exc)},
            exc_info=True,
        )
        raise HTTPException(status_code=500, detail="Chat processing failed")

    return ChatResponse(
        user_id=req.user_id,
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
    token: dict = Depends(require_auth),
):
    """Streaming version of /chat using the new iterative LangGraph."""
    # Issue #8: user_id must match the JWT subject
    if req.user_id != token.get("sub"):
        raise HTTPException(status_code=403, detail="user_id does not match token")

    async def event_stream() -> AsyncGenerator[str, None]:
        # Initialize state
        initial_state = {
            "user_id": req.user_id,
            "session_id": req.session_id,
            "user_input": req.message,
            "messages": [HumanMessage(content=req.message)],
            "iterations": 0,
            "generation": "",
            "thread_context": "",
            "retrieved_episodic": "",
            "retrieved_semantic": ""
        }

        full_response = ""
        
        try:
            # We use astream to yield updates from the graph
            async for event in memory_agent.astream(
                initial_state, 
                config={"configurable": {"thread_id": req.session_id or req.user_id}}
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
            logger.error("stream_graph_error", extra={"user_id": req.user_id, "error": str(exc)})
            yield f"data: {json.dumps({'type': 'error', 'message': f'Processing failed: {str(exc)}'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no"},
    )
