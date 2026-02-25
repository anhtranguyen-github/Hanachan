"""
LangGraph Memory-Augmented Agent.
"""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from typing_extensions import TypedDict

from ..services.memory import episodic_memory as ep_mem
from ..services.memory import semantic_memory as sem_mem
from ..services.memory import session_memory as sess_mem
from ..services import learning_service as learn_serv
from ..core.config import settings
from ..schemas.memory import KnowledgeGraph


# ---------------------------------------------------------------------------
# LLM instances
# ---------------------------------------------------------------------------

_llm: Optional[ChatOpenAI] = None
_extraction_llm = None


def _get_llm() -> ChatOpenAI:
    global _llm
    if _llm is None:
        _llm = ChatOpenAI(
            model=settings.llm_model,
            temperature=0,
            openai_api_key=settings.openai_api_key,
        )
    return _llm


def _get_extraction_llm():
    global _extraction_llm
    if _extraction_llm is None:
        _extraction_llm = _get_llm().with_structured_output(KnowledgeGraph)
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
# Node: retrieve_memory
# ---------------------------------------------------------------------------

def retrieve_memory(state: AgentState) -> Dict[str, Any]:
    user_id = state["user_id"]
    session_id = state.get("session_id")
    query = state["user_input"]

    if session_id:
        thread_text = sess_mem.get_thread_context_text(session_id, last_n=10)
        session_data = sess_mem.get_session(session_id)
        if session_data and session_data.get("summary"):
            thread_text = f"[Thread summary]: {session_data['summary']}\n\n[Recent messages]:\n{thread_text}"
    else:
        thread_text = "(no active session)"

    ep_results = ep_mem.search_episodic_memory(user_id, query, k=3)
    episodic_text = (
        "\n".join(f"- {m.text}" for m in ep_results)
        or "(no episodic memories)"
    )

    keywords = [w for w in query.split() if len(w) > 3][:8]
    sem_results = sem_mem.search_semantic_memory(user_id, keywords)
    semantic_text = (
        "\n".join(
            f"- ({r['node'].get('id')} [{r['node'].get('type')}])"
            f" —[{r['relationship']}]→ "
            f"({r['related'].get('id')} [{r['related'].get('type')}])"
            for r in sem_results[:10]
        )
        or "(no semantic facts)"
    )

    # 4. Learning Progress (Supabase)
    learning_text = ""
    # Simple heuristic to check for KU identifiers (characters or common words)
    # Extract kanji/hangul/etc or words from query
    potential_identifiers = query.split()
    # Also check if it's a single character request
    if len(query) == 1:
        potential_identifiers.append(query)
    
    # Check for keywords like "status", "progress", "learning"
    prog_keywords = ["status", "progress", "learning", "state", "how is my", "review"]
    is_progress_query = any(k in query.lower() for k in prog_keywords)

    if is_progress_query or len(query) <= 5:
        progress_info = []
        for ident in potential_identifiers:
            # Clean up identifier (remove punctuation)
            clean_ident = "".join(c for c in ident if c.isalnum() or ord(c) > 0x4e00)
            if not clean_ident: continue
            
            status = learn_serv.get_ku_status(user_id, clean_ident)
            if status:
                progress_info.append(
                    f"- {status.character} ({status.meaning}): State={status.state}, "
                    f"Reps={status.reps}, Next Review={status.next_review or 'None'}"
                )
        
        if progress_info:
            learning_text = "\n".join(progress_info)
        else:
            learning_text = "(no specific KU status found for this query)"
    
    combined = (
        f"=== Current Thread Context ===\n{thread_text}\n\n"
        f"=== Relevant Past Conversations (Episodic Memory) ===\n{episodic_text}\n\n"
        f"=== Known Facts about User (Semantic Memory) ===\n{semantic_text}\n\n"
        f"=== User Learning Progress (Knowledge Units) ===\n{learning_text}"
    )

    return {
        "thread_context": thread_text,
        "retrieved_episodic": episodic_text,
        "retrieved_semantic": semantic_text,
        "retrieved_memories": combined,
    }


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
    chain = _GENERATION_PROMPT | _get_llm()
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
        chain = _SUMMARY_PROMPT | _get_llm()
        summary = chain.invoke(
            {"user_input": user_input, "assistant_output": assistant_output}
        ).content
        ep_mem.add_episodic_memory(user_id, summary)
    except Exception as exc:
        print(f"[update_memory] episodic error: {exc}")

    try:
        chain = _EXTRACTION_PROMPT | _get_extraction_llm()
        kg_data: KnowledgeGraph = chain.invoke(
            {"user_input": user_input, "assistant_output": assistant_output}
        )
        sem_mem.add_semantic_facts(user_id, kg_data)
    except Exception as exc:
        print(f"[update_memory] semantic error: {exc}")

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
    """
    Invoke the memory-augmented agent.
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
