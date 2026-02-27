"""
LangGraph Memory-Augmented Agent.
"""
from __future__ import annotations

import logging
from concurrent.futures import ThreadPoolExecutor, wait, FIRST_COMPLETED, ALL_COMPLETED
from typing import Any, Dict, List, Optional

from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from typing_extensions import TypedDict

from ..services.memory import episodic_memory as ep_mem
from ..services.memory import semantic_memory as sem_mem
from ..services.memory import session_memory as sess_mem
from ..services import learning_service as learn_serv
from ..core.llm import make_llm
from ..schemas.memory import KnowledgeGraph

logger = logging.getLogger(__name__)

# Thread pool for parallel memory retrieval (lazy initialization)
_pool: Optional[ThreadPoolExecutor] = None


def _get_pool() -> ThreadPoolExecutor:
    """Get or create the thread pool (lazy initialization)."""
    global _pool
    if _pool is None:
        _pool = ThreadPoolExecutor(max_workers=8, thread_name_prefix="agent")
    return _pool


def shutdown_pool() -> None:
    """Shutdown the thread pool gracefully. Call on application shutdown."""
    global _pool
    if _pool is not None:
        _pool.shutdown(wait=True, cancel_futures=False)
        _pool = None
        logger.info("memory_agent_pool_shutdown")


# ---------------------------------------------------------------------------
# LLM instances (lazy, with timeout via make_llm)
# ---------------------------------------------------------------------------

_extraction_llm = None


def _get_extraction_llm():
    global _extraction_llm
    if _extraction_llm is None:
        _extraction_llm = make_llm().with_structured_output(KnowledgeGraph)
    return _extraction_llm


# ---------------------------------------------------------------------------
# Agent state
# ---------------------------------------------------------------------------

class AgentState(TypedDict):
    user_id: str
    session_id: Optional[str]
    user_input: str
    thread_context: str
    retrieved_episodic: str
    retrieved_semantic: str
    retrieved_memories: str
    generation: str


# ---------------------------------------------------------------------------
# Node: retrieve_memory (parallelised)
# ---------------------------------------------------------------------------

def _fetch_thread(session_id: str) -> str:
    thread_text = sess_mem.get_thread_context_text(session_id, last_n=10)
    session_data = sess_mem.get_session(session_id)
    if session_data and session_data.get("summary"):
        thread_text = (
            f"[Thread summary]: {session_data['summary']}\n\n"
            f"[Recent messages]:\n{thread_text}"
        )
    return thread_text


def _fetch_episodic(user_id: str, query: str) -> str:
    ep_results = ep_mem.search_episodic_memory(user_id, query, k=3)
    return (
        "\n".join(f"- {m.text}" for m in ep_results)
        or "(no episodic memories)"
    )


def _fetch_semantic(user_id: str, query: str) -> str:
    keywords = [w for w in query.split() if len(w) > 3][:8]
    sem_results = sem_mem.search_semantic_memory(user_id, keywords)
    return (
        "\n".join(
            f"- ({r['node'].get('id')} [{r['node'].get('type')}])"
            f" —[{r['relationship']}]→ "
            f"({r['related'].get('id')} [{r['related'].get('type')}])"
            for r in sem_results[:10]
        )
        or "(no semantic facts)"
    )


def retrieve_memory(state: AgentState) -> Dict[str, Any]:
    """Fetch episodic, semantic, and session context.

    For the synchronous LangGraph node we run the three independent I/O calls
    concurrently using the thread pool via concurrent.futures (no event loop overhead).
    """
    user_id = state["user_id"]
    session_id = state.get("session_id")
    query = state["user_input"]

    # Submit tasks to thread pool directly (no event loop needed)
    pool = _get_pool()
    ep_future = pool.submit(_fetch_episodic, user_id, query)
    sem_future = pool.submit(_fetch_semantic, user_id, query)

    if session_id:
        thread_future = pool.submit(_fetch_thread, session_id)
        futures = [ep_future, sem_future, thread_future]
        wait(futures, return_when=ALL_COMPLETED)
        ep_text = ep_future.result()
        sem_text = sem_future.result()
        thread_text = thread_future.result()
    else:
        futures = [ep_future, sem_future]
        wait(futures, return_when=ALL_COMPLETED)
        ep_text = ep_future.result()
        sem_text = sem_future.result()
        thread_text = "(no active session)"

    # Degrade gracefully if any source failed
    if isinstance(ep_text, Exception):
        logger.warning("episodic_retrieval_failed", extra={"error": str(ep_text)})
        ep_text = "(episodic memory unavailable)"
    if isinstance(sem_text, Exception):
        logger.warning("semantic_retrieval_failed", extra={"error": str(sem_text)})
        sem_text = "(semantic memory unavailable)"
    if isinstance(thread_text, Exception):
        logger.warning("thread_retrieval_failed", extra={"error": str(thread_text)})
        thread_text = "(thread context unavailable)"

    # Learning progress (Supabase)
    learning_text = _fetch_learning(user_id, query)

    combined = (
        f"=== Current Thread Context ===\n{thread_text}\n\n"
        f"=== Relevant Past Conversations (Episodic Memory) ===\n{ep_text}\n\n"
        f"=== Known Facts about User (Semantic Memory) ===\n{sem_text}\n\n"
        f"=== User Learning Progress (Knowledge Units) ===\n{learning_text}"
    )

    return {
        "thread_context": thread_text,
        "retrieved_episodic": ep_text,
        "retrieved_semantic": sem_text,
        "retrieved_memories": combined,
    }


def _fetch_learning(user_id: str, query: str) -> str:
    potential_identifiers = query.split()
    if len(query) == 1:
        potential_identifiers.append(query)

    prog_keywords = ["status", "progress", "learning", "state", "how is my", "review"]
    is_progress_query = any(k in query.lower() for k in prog_keywords)

    if not (is_progress_query or len(query) <= 5):
        return ""

    progress_info = []
    for ident in potential_identifiers:
        clean_ident = "".join(c for c in ident if c.isalnum() or ord(c) > 0x4E00)
        if not clean_ident:
            continue
        status = learn_serv.get_ku_status(user_id, clean_ident)
        if status:
            progress_info.append(
                f"- {status.character} ({status.meaning}): State={status.state}, "
                f"Reps={status.reps}, Next Review={status.next_review or 'None'}"
            )

    return (
        "\n".join(progress_info)
        if progress_info
        else "(no specific KU status found for this query)"
    )


# ---------------------------------------------------------------------------
# Node: generate_response
# ---------------------------------------------------------------------------

_GENERATION_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are a helpful, personalized AI assistant with persistent memory.\n"
        "You have access to three memory layers:\n"
        "  1. Current thread — the ongoing conversation in THIS session\n"
        "  2. Episodic memory — summaries of PAST sessions\n"
        "  3. Semantic memory — structured facts about the user\n\n"
        "Use ALL layers to give a coherent, context-aware, and personalized response. "
        "If the thread context already covers what the user asks, prefer that. "
        "If memory contradicts the user's message, ask for clarification politely. "
        "Never reveal raw memory text to the user.",
    ),
    (
        "human",
        "User question: {user_input}\n\n"
        "Memory context:\n{retrieved_memories}",
    ),
])


def generate_response(state: AgentState) -> Dict[str, Any]:
    chain = _GENERATION_PROMPT | make_llm()
    result = chain.invoke(
        {
            "user_input": state["user_input"],
            "retrieved_memories": state["retrieved_memories"],
        }
    )
    return {"generation": result.content}


# ---------------------------------------------------------------------------
# Node: update_memory
# ---------------------------------------------------------------------------

_SUMMARY_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "Create a concise one-sentence third-person summary of this user-assistant "
        "interaction for use as a long-term episodic memory.",
    ),
    (
        "human",
        "User: {user_input}\nAssistant: {assistant_output}",
    ),
])

_EXTRACTION_PROMPT = ChatPromptTemplate.from_messages([
    (
        "system",
        "Extract key entities and relationships from this conversation. "
        "Focus on user preferences, goals, stated facts, and named entities. "
        "Model them as a minimal knowledge graph.",
    ),
    (
        "human",
        "User: {user_input}\nAssistant: {assistant_output}",
    ),
])


def update_memory(state: AgentState) -> Dict[str, Any]:
    user_id = state["user_id"]
    session_id = state.get("session_id")
    user_input = state["user_input"]
    assistant_output = state["generation"]

    if session_id:
        sess_mem.add_message(session_id, "user", user_input)
        sess_mem.add_message(session_id, "assistant", assistant_output)

    try:
        chain = _SUMMARY_PROMPT | make_llm()
        summary = chain.invoke(
            {"user_input": user_input, "assistant_output": assistant_output}
        ).content
        ep_mem.add_episodic_memory(user_id, summary)
    except Exception as exc:
        logger.error("update_memory_episodic_error", extra={"error": str(exc)})

    try:
        chain = _EXTRACTION_PROMPT | _get_extraction_llm()
        kg_data: KnowledgeGraph = chain.invoke(
            {"user_input": user_input, "assistant_output": assistant_output}
        )
        sem_mem.add_semantic_facts(user_id, kg_data)
    except Exception as exc:
        logger.error("update_memory_semantic_error", extra={"error": str(exc)})

    return {}


# ---------------------------------------------------------------------------
# Compile graph
# ---------------------------------------------------------------------------

def _build_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("retrieve", retrieve_memory)
    workflow.add_node("generate", generate_response)
    workflow.add_node("update", update_memory)

    workflow.set_entry_point("retrieve")
    workflow.add_edge("retrieve", "generate")
    workflow.add_edge("generate", "update")
    workflow.add_edge("update", END)

    return workflow.compile()


memory_agent = _build_graph()


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def run_chat(
    user_id: str,
    message: str,
    session_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Invoke the memory-augmented agent.

    Returns: response, episodic_context, semantic_context, thread_context
    """
    result = memory_agent.invoke(
        {
            "user_id": user_id,
            "session_id": session_id,
            "user_input": message,
            "thread_context": "",
            "retrieved_episodic": "",
            "retrieved_semantic": "",
            "retrieved_memories": "",
            "generation": "",
        }
    )
    return {
        "response": result["generation"],
        "episodic_context": result["retrieved_episodic"],
        "semantic_context": result["retrieved_semantic"],
        "thread_context": result["thread_context"],
    }
