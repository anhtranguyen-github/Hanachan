import asyncio
import json
from typing import AsyncGenerator
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langchain_openai import ChatOpenAI

from ....schemas.chat import ChatRequest, ChatResponse
from ....agents.memory_agent import run_chat, retrieve_memory, update_memory, AgentState
from ....core.config import settings

router = APIRouter()

@router.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(req: ChatRequest):
    """
    Memory-augmented chat.
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

@router.post("/chat/stream", tags=["Chat"])
async def chat_stream(req: ChatRequest):
    """
    Streaming version of `/memory/chat` using Server-Sent Events.
    """
    async def event_stream() -> AsyncGenerator[str, None]:
        from ....agents.memory_agent import _GENERATION_PROMPT

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
        try:
            retrieved = await asyncio.get_event_loop().run_in_executor(
                None, retrieve_memory, ctx_state
            )
            ctx_state.update(retrieved)
        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
            return

        yield f"data: {json.dumps({'type': 'context', 'episodic': ctx_state['retrieved_episodic'], 'semantic': ctx_state['retrieved_semantic'], 'thread': ctx_state['thread_context']})}\n\n"

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
                    "retrieved_memories": ctx_state["retrieved_memories"],
                }
            ):
                token = chunk.content
                full_response += token
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"
        except Exception as exc:
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"
            return

        ctx_state["generation"] = full_response
        try:
            await asyncio.get_event_loop().run_in_executor(
                None, update_memory, ctx_state
            )
        except Exception as exc:
            print(f"[stream] memory update error: {exc}")

        yield f"data: {json.dumps({'type': 'done', 'session_id': req.session_id})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")
