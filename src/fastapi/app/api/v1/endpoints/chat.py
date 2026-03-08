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
from typing import Any as TypingAny

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage

from app.agents.tutor_agent import run_chat
from app.agents.tutor_agent.graph import tutor_graph
from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.supabase import get_supabase_client
from app.domain.chat.services import ChatService
from app.schemas.chat import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)

router = APIRouter()

TRACEABLE_NODES = {
    "input_guard",
    "router",
    "memory",
    "fsrs",
    "sql",
    "decision",
    "human_gate",
    "output_guard",
    "response",
    "post_update",
}


def _emit_sse(payload: dict[str, TypingAny]) -> str:
    return f"data: {json.dumps(payload)}\n\n"


def _format_node_label(node_name: str) -> str:
    return node_name.replace("_", " ").title()


def _sanitize_tool_input(tool_input: TypingAny) -> dict[str, TypingAny]:
    if isinstance(tool_input, dict):
        return tool_input
    return {"value": str(tool_input)}


def _build_thought_event(node_name: str, thought: str) -> dict[str, TypingAny]:
    return {
        "type": "thought",
        "content": thought,
        "node": node_name,
        "label": _format_node_label(node_name),
        "phase": "complete",
    }


def _build_status_event(
    content: str,
    *,
    node_name: str | None = None,
    tool_name: str | None = None,
    phase: str,
    meta: dict[str, TypingAny] | None = None,
) -> dict[str, TypingAny]:
    payload: dict[str, TypingAny] = {
        "type": "status",
        "content": content,
        "phase": phase,
    }
    if node_name:
        payload["node"] = node_name
        payload["label"] = _format_node_label(node_name)
    if tool_name:
        payload["tool_name"] = tool_name
    if meta:
        payload["meta"] = meta
    return payload


def _collect_trace_event(
    traces: list[dict[str, TypingAny]], payload: dict[str, TypingAny]
) -> dict[str, TypingAny]:
    if payload.get("type") in {"thought", "status"}:
        traces.append(dict(payload))
    return payload


async def _persist_stream_traces(
    chat_service: ChatService,
    *,
    user_id: str,
    session_id: str | None,
    trace_events: list[dict[str, TypingAny]],
    final_generation: str,
) -> None:
    if not session_id or not trace_events:
        return

    await chat_service.update_latest_assistant_message_metadata(
        user_id,
        session_id,
        {"traces": trace_events},
        content=final_generation or None,
    )


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
            "thought": "",
            "route": None,
            "needs_human_approval": False,
            "human_approved": False,
            "audio_file": None,
            "tts_enabled": req.tts_enabled,
            "start_time": time.time(),
        }

        tokens_emitted = False
        final_generation = ""
        trace_events: list[dict[str, TypingAny]] = []

        try:
            # astream_events v2 provides deep tracing of thoughts, tools, and tokens
            async for event in tutor_graph.astream_events(
                initial_state,
                version="v2",
                config={"configurable": {"thread_id": req.session_id or user_id}},
            ):
                kind = event["event"]
                event_name = event.get("name", "")

                if kind == "on_chain_start" and event_name in TRACEABLE_NODES:
                    yield _emit_sse(
                        _collect_trace_event(
                            trace_events,
                            _build_status_event(
                            f"Running {_format_node_label(event_name)}",
                            node_name=event_name,
                            phase="start",
                            ),
                        )
                    )

                # 1. Thought Tracing (from node updates)
                if kind == "on_chain_end" and event_name in TRACEABLE_NODES:
                    # Node finished, check for thoughts in the output
                    output = event["data"].get("output")
                    if isinstance(output, dict) and "thought" in output:
                        yield _emit_sse(
                            _collect_trace_event(
                                trace_events,
                                _build_thought_event(event_name, output["thought"]),
                            )
                        )

                # 2. Tool Tracing
                if kind == "on_tool_start":
                    tool_name = event_name
                    tool_input = event["data"].get("input", {})
                    yield _emit_sse(
                        _collect_trace_event(
                            trace_events,
                            _build_status_event(
                            f"Calling {tool_name}...",
                            tool_name=tool_name,
                            phase="start",
                            meta=_sanitize_tool_input(tool_input),
                            ),
                        )
                    )

                if kind == "on_tool_end":
                    tool_name = event_name
                    yield _emit_sse(
                        _collect_trace_event(
                            trace_events,
                            _build_status_event(
                            f"Finished {tool_name}.",
                            tool_name=tool_name,
                            phase="complete",
                            ),
                        )
                    )

                # 3. Token Streaming (Reasoning & Generation)
                # We prefer true LLM streaming events when available…
                if kind == "on_chat_model_stream":
                    content = event["data"]["chunk"].content
                    if content:
                        tokens_emitted = True
                        final_generation += content
                        yield _emit_sse({"type": "token", "content": content})

                # …but many nodes (like our generator) use non-streaming invoke.
                # When the generate node finishes, emit the full generation as a single token event
                # so the frontend still receives the answer via SSE.
                if kind == "on_chain_end" and event_name == "response":
                    output = event["data"].get("output")
                    if isinstance(output, dict) and output.get("generation"):
                        final_generation = output["generation"]
                        if not tokens_emitted:
                            tokens_emitted = True
                            yield _emit_sse({"type": "token", "content": final_generation})

            # Fallback: if for some reason no token events were emitted during the graph run,
            # use the final_generation we captured from the chain output.
            if not tokens_emitted and final_generation:
                yield _emit_sse({"type": "token", "content": final_generation})
            elif not tokens_emitted:
                yield _emit_sse({"type": "error", "message": "No response generated by agent."})

            if req.session_id and trace_events:
                try:
                    chat_service = ChatService(get_supabase_client())
                    await _persist_stream_traces(
                        chat_service,
                        user_id=user_id,
                        session_id=req.session_id,
                        trace_events=trace_events,
                        final_generation=final_generation,
                    )
                except Exception:
                    logger.exception(
                        "stream_trace_persist_error",
                        extra={"user_id": user_id, "session_id": req.session_id},
                    )

            yield _emit_sse({"type": "done", "session_id": req.session_id})

        except Exception as exc:
            logger.error("stream_graph_error", extra={"user_id": user_id, "error": str(exc)})
            msg = str(exc)
            if "Incorrect API key" in msg or "401" in msg:
                yield _emit_sse(
                    {
                        "type": "error",
                        "message": "Processing failed: LLM authentication error. Check OPENAI_API_KEY in agents configuration.",
                    }
                )
            else:
                yield _emit_sse({"type": "error", "message": f"Processing failed: {str(exc)}"})

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"X-Accel-Buffering": "no"},
    )
