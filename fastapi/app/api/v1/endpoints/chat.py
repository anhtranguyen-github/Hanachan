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

import asyncio
import json
import logging
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import StreamingResponse

from ....schemas.chat import ChatRequest, ChatResponse
from ....agents.memory_agent import run_chat, retrieve_memory, update_memory, AgentState
from ....core.security import require_auth
from ....core.rate_limit import limiter
from ....core.llm import make_llm
from ....core.config import settings
from ....agents.memory_agent import _GENERATION_PROMPT

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
    """Streaming version of /chat using Server-Sent Events."""
    # Issue #8: user_id must match the JWT subject
    if req.user_id != token.get("sub"):
        raise HTTPException(status_code=403, detail="user_id does not match token")

    async def event_stream() -> AsyncGenerator[str, None]:
        ctx_state: AgentState = {
            "user_id": req.user_id,
            "session_id": req.session_id,
            "user_input": req.message,
            "thread_context": "",
            "retrieved_episodic": "",
            "retrieved_semantic": "",
            "retrieved_memories": "",
            "generation": "",
        }

        # Issue #19: timeout memory retrieval
        try:
            retrieved = await asyncio.wait_for(
                asyncio.get_running_loop().run_in_executor(
                    None, retrieve_memory, ctx_state
                ),
                timeout=10.0,
            )
            ctx_state.update(retrieved)
        except asyncio.TimeoutError:
            logger.warning("stream_memory_retrieval_timeout", extra={"user_id": req.user_id})
            yield f"data: {json.dumps({'type': 'error', 'message': 'Memory retrieval timed out'})}\n\n"
            return
        except Exception as exc:
            logger.error("stream_memory_error", extra={"user_id": req.user_id, "error": str(exc)})
            yield f"data: {json.dumps({'type': 'error', 'message': 'Memory unavailable'})}\n\n"
            return

        context_payload = json.dumps({
            "type": "context",
            "episodic": ctx_state["retrieved_episodic"],
            "semantic": ctx_state["retrieved_semantic"],
            "thread": ctx_state["thread_context"],
        })
        yield f"data: {context_payload}\n\n"

        # Issue #5: streaming LLM with timeout
        llm_stream = make_llm(streaming=True)
        chain = _GENERATION_PROMPT | llm_stream
        full_response = ""

        try:
            async with asyncio.timeout(60.0):  # 60s wall-clock deadline for full stream
                async for chunk in chain.astream(
                    {
                        "user_input": req.message,
                        "retrieved_memories": ctx_state["retrieved_memories"],
                    }
                ):
                    token_text = chunk.content
                    full_response += token_text
                    yield f"data: {json.dumps({'type': 'token', 'content': token_text})}\n\n"
        except asyncio.TimeoutError:
            logger.warning("stream_generation_timeout", extra={"user_id": req.user_id})
            yield f"data: {json.dumps({'type': 'error', 'message': 'Generation timed out'})}\n\n"
            return
        except Exception as exc:
            logger.error("stream_generation_error", extra={"user_id": req.user_id, "error": str(exc)})
            yield f"data: {json.dumps({'type': 'error', 'message': 'Generation failed'})}\n\n"
            return

        ctx_state["generation"] = full_response
        try:
            await asyncio.get_running_loop().run_in_executor(
                None, update_memory, ctx_state
            )
        except Exception as exc:
            logger.error("stream_memory_update_error", extra={"user_id": req.user_id, "error": str(exc)})

        yield f"data: {json.dumps({'type': 'done', 'session_id': req.session_id})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no"},  # disable nginx buffering for SSE
    )
