"""
LangGraph Memory-Augmented Agent (Iterative Version).
Graph: planning -> tools -> reviewer -> decide -> (rewrite -> planning) or (generate -> update -> END)
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Annotated
from typing_extensions import TypedDict

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END

import os
from elevenlabs.client import ElevenLabs

from ..services.memory import episodic_memory as ep_mem
from ..services.memory import semantic_memory as sem_mem
from ..services.memory import session_memory as sess_mem
from ..services import learning_service as learn_serv
from ..core.llm import make_llm
from ..schemas.memory import KnowledgeGraph

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Agent State
# ---------------------------------------------------------------------------


class AgentState(TypedDict):
    user_id: str
    session_id: Optional[str]
    user_input: str
    # Iterative fields
    messages: Annotated[List[BaseMessage], lambda x, y: x + y]
    plan: str
    iterations: int
    review_result: str  # "generate" or "rewrite"
    rewritten_query: Optional[str]
    # Final output
    generation: str
    audio_file: Optional[str]
    tts_enabled: bool
    # For return compatibility
    thread_context: str
    retrieved_episodic: str
    retrieved_semantic: str


# ---------------------------------------------------------------------------
# Tools (The "Bridge" to Memory Layers & Databases)
# ---------------------------------------------------------------------------


@tool
def get_episodic_memory(query: str, user_id: str = "INJECTED") -> str:
    """Search past conversation summaries for context about a user's history or preferences.
    Use this if you need to remember what we talked about in previous sessions.
    (Note: user_id is handled automatically)
    """
    results = ep_mem.search_episodic_memory(user_id, query, k=3)
    if not results:
        return "No relevant past conversations found."
    return "\n".join([f"- {r.text} (Context score: {r.score})" for r in results])


@tool
def get_semantic_facts(keywords: List[str], user_id: str = "INJECTED") -> str:
    """Search structured facts about the user (interests, goals, preferred settings).
    Use this for specific factual questions about the person.
    (Note: user_id is handled automatically)
    """
    results = sem_mem.search_semantic_memory(user_id, keywords)
    logger.info(
        f"get_semantic_facts tool: found {len(results)} items for user {user_id}"
    )
    if not results:
        return "No specific facts found for these keywords."
    res_text = "\n".join(
        [
            f"- ({r['source'].get('id')}) —[{r['relationship']}]→ ({r['target'].get('id')})"
            for r in results[:15]
        ]
    )
    return res_text


@tool
def get_user_learning_progress(identifier: str, include_notes: bool = False, user_id: str = "INJECTED") -> str:
    """Retrieve live learning stats for a specific Japanese character or slug.
    Identifiers can be Kanji (e.g. '桜'), Slugs (e.g. 'sakura'), or Words.
    If include_notes is True, it will also return the user's personal/agent notes for this item.
    (Note: user_id is handled automatically)
    """
    status = learn_serv.get_ku_status(user_id, identifier, include_notes=include_notes)
    if not status:
        return f"No learning record found for '{identifier}'."
        
    notes_str = f"Notes:\n{status.notes}\n" if status.notes else "Notes: None\n"
    
    return (
        f"Item: {status.character} ({status.meaning})\n"
        f"State: {status.state}\n"
        f"Reps: {status.reps}, Difficulty: {status.difficulty}\n"
        f"Next Review: {status.next_review or 'Not scheduled'}\n"
        f"{notes_str}"
    )


@tool
def search_knowledge_units(query: str) -> str:
    """Search the general Japanese knowledge database for meanings, characters, or slugs.
    Use this if the user asks 'What does X mean?' or 'How do you write Y?'.
    """
    results = learn_serv.search_kus(query, limit=5)
    if not results:
        return f"No knowledge units found for '{query}'."
    return "\n".join(
        [
            f"- {r['character']} ({r['meaning']}) [slug: {r['slug']}, type: {r['type']}]"
            for r in results
        ]
    )


# Tool list for the Planner
TOOLS = [
    get_episodic_memory,
    get_semantic_facts,
    get_user_learning_progress,
    search_knowledge_units,
]


def tools_node(state: AgentState) -> Dict[str, Any]:
    """Custom tool node that injects the actual user_id from state into tool calls."""
    user_id = state["user_id"]
    last_msg = state["messages"][-1]

    if not last_msg.tool_calls:
        return {"messages": []}

    results = []
    for tool_call in last_msg.tool_calls:
        tool_name = tool_call["name"]
        args = tool_call["args"]

        # Inject user_id if needed
        if tool_name in [
            "get_episodic_memory",
            "get_semantic_facts",
            "get_user_learning_progress",
        ]:
            args["user_id"] = user_id

        # Find the tool and invoke
        tool_map = {t.name: t for t in TOOLS}
        if tool_name in tool_map:
            content = tool_map[tool_name].invoke(args)
            results.append(
                ToolMessage(
                    tool_call_id=tool_call["id"], content=str(content), name=tool_name
                )
            )

    return {"messages": results}


# ---------------------------------------------------------------------------
# Nodes (Logic blocks)
# ---------------------------------------------------------------------------

PLANNER_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a strategic planning node for a Japanese language learning assistant.\n"
            "Your goal is to decide which tools to call to gather enough context to answer the user's message accurately.\n\n"
            "User session context:\n{thread_context}\n\n"
            "Instructions:\n"
            "1. Analyze the user's message.\n"
            "2. If the message is a simple greeting, you may not need tools.\n"
            "3. If it involves their learning progress, use 'get_user_learning_progress'.\n"
            "4. If it's about Japanese grammar/vocab, use 'search_knowledge_units'.\n"
            "5. If it refers to past conversations, use 'get_episodic_memory'.\n"
            "6. If it's about their personal facts, interests, or goals, use 'get_semantic_facts'.\n"
            "7. If you have already gathered info, decide if you need more or if you can proceed to answer.\n\n"
            "Current Date: {date}",
        ),
        ("placeholder", "{messages}"),
    ]
)


def planner_node(state: AgentState) -> Dict[str, Any]:
    """Decides what the agent should do next (call tools or generate)."""
    llm = make_llm().bind_tools(TOOLS)

    # Pre-fetch thread context for the prompt
    thread_text = (
        sess_mem.get_thread_context_text(state["session_id"], last_n=5)
        if state.get("session_id")
        else "No active session."
    )

    chain = PLANNER_PROMPT | llm
    response = chain.invoke(
        {
            "messages": state["messages"],
            "thread_context": thread_text,
            "date": datetime.now().strftime("%Y-%m-%d"),
        }
    )

    return {"messages": [response], "iterations": state.get("iterations", 0) + 1}


REVIEWER_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a Quality Assurance reviewer. Evaluate the gathered context against the user's original intent.\n\n"
            "User Input: {user_input}\n"
            "Gathered Context: {messages}\n\n"
            "Decision Rules:\n"
            "- If the tool results clearly answer the user's question, respond with 'GENERATE'.\n"
            "- If the tool results are missing key information (e.g. couldn't find a record), respond with 'REWRITE' followed by a suggestion for a better search query.\n"
            "- If you have looped more than 3 times, respond with 'GENERATE' to avoid frustration.\n\n"
            "Return ONLY the decision word and suggestion if applicable.",
        ),
        ("human", "Check if we have enough info."),
    ]
)


def reviewer_node(state: AgentState) -> Dict[str, Any]:
    """Checks if the tool results are sufficient."""
    llm = make_llm()
    chain = REVIEWER_PROMPT | llm
    messages_text = "\n".join(
        [f"{m.type.capitalize()}: {m.content}" for m in state["messages"]]
    )
    response = chain.invoke(
        {"user_input": state["user_input"], "messages": messages_text}
    )

    content = response.content.upper()
    if "GENERATE" in content or state["iterations"] >= 3:
        return {"review_result": "generate"}
    else:
        # Extract suggested rewrite if present
        suggestion = content.replace("REWRITE", "").strip()
        return {"review_result": "rewrite", "rewritten_query": suggestion}


def rewriter_node(state: AgentState) -> Dict[str, Any]:
    """Modifies the message list to guide the planner towards a better tool call."""
    suggestion = state.get("rewritten_query", "Try searching for simpler keywords.")
    return {
        "messages": [
            HumanMessage(
                content=f"[Reviewer Feedback]: The previous tools didn't find enough. {suggestion}"
            )
        ]
    }


GENERATION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are Hanachan, a helpful and personalized Japanese learning assistant.\n"
            "Use the retrieved context to answer the user. Be concise, warm, and professional.\n"
            "Reference the facts found if relevant, but don't show raw metadata.\n\n"
            "Context:\n{messages}",
        ),
        ("human", "{user_input}"),
    ]
)


def generator_node(state: AgentState) -> Dict[str, Any]:
    """Generates the final response based on all gathered context."""
    llm = make_llm()
    chain = GENERATION_PROMPT | llm
    lines = []
    for m in state["messages"]:
        role = m.type.capitalize()
        if m.type == "ai" and hasattr(m, "tool_calls") and m.tool_calls:
            calls = ", ".join([tc["name"] for tc in m.tool_calls])
            lines.append(f"{role} (Calling tools: {calls}): {m.content}")
        elif m.type == "tool":
            lines.append(f"Tool Result ({getattr(m, 'name', 'unknown')}): {m.content}")
        else:
            lines.append(f"{role}: {m.content}")
    messages_text = "\n".join(lines)
    print(
        f"\n--- DEBUG GENERATOR CONTEXT ---\n{messages_text}\n-------------------------------\n"
    )

    response = chain.invoke(
        {"user_input": state["user_input"], "messages": messages_text}
    )

    return {"generation": response.content}


def tts_node(state: AgentState) -> Dict[str, Any]:
    """Generates voice for the final response using ElevenLabs SDK and stores it on Supabase."""
    if not state.get("tts_enabled", True):
        return {"audio_file": None}
        
    if state.get("generation"):
        try:
            import uuid
            from app.core.config import settings
            from supabase import create_client

            # Use native ElevenLabs client for reliability on SDK ^2.0
            client = ElevenLabs(api_key=settings.elevenlabs_api_key)
            
            # Fetch audio stream
            audio_stream = client.text_to_speech.convert(
                text=state["generation"],
                voice_id="JBFqnCBsd6RMkjVDRZzb",
                model_id="eleven_multilingual_v2"
            )
            
            import tempfile
            temp_dir = tempfile.gettempdir()
            temp_file = f"{temp_dir}/agent_tts_{uuid.uuid4()}.wav"
            with open(temp_file, "wb") as f:
                for chunk in audio_stream:
                    f.write(chunk)
            
            if os.path.exists(temp_file):
                # Initialize supabase client
                supabase = create_client(settings.supabase_url, settings.supabase_key)
                
                # Upload to public tts_audio bucket
                file_name = f"{uuid.uuid4()}.wav"
                
                supabase.storage.from_("tts_audio").upload(
                    path=file_name,
                    file=temp_file,
                    file_options={"content-type": "audio/wav"}
                )
                
                # Retrieve the public URL
                public_url = supabase.storage.from_("tts_audio").get_public_url(file_name)
                
                # Cleanup temporary file
                try:
                    os.remove(temp_file)
                except Exception as e:
                    logger.warning(f"Failed to delete temp audio file {temp_file}: {e}")
                    
                return {"audio_file": public_url}
        except Exception as e:
            logger.error(f"ElevenLabs TTS (or Supabase upload) failed: {e}")
            return {"audio_file": None}
    return {}


def update_memory_node(state: AgentState) -> Dict[str, Any]:
    """Final node to persist the side effects (episodic/semantic update)."""
    user_id = state["user_id"]
    session_id = state.get("session_id")
    user_input = state["user_input"]
    output = state["generation"]

    # 1. Update Session Memory
    if session_id:
        # Ensure session exists in DB before adding messages
        existing = sess_mem.get_session(session_id)
        if not existing:
            sess_mem.create_session(user_id)
            # Override the auto-generated ID with our session_id
            from ..core.database import execute_query
            from datetime import datetime, timezone

            now = datetime.now(timezone.utc)
            execute_query(
                "INSERT INTO public.chat_sessions (id, user_id, created_at, updated_at) "
                "VALUES (%s, %s, %s, %s) ON CONFLICT (id) DO NOTHING",
                (session_id, user_id, now, now),
                fetch=False,
            )
        sess_mem.add_message(session_id, "user", user_input)
        sess_mem.add_message(session_id, "assistant", output)

    # 2. Extract and Update Memory Layers (Episodic & Semantic)
    # We use a secondary LLM call to summarize and extract facts
    try:
        extraction_llm = make_llm().with_structured_output(KnowledgeGraph)
        summary_llm = make_llm()

        # Summary
        summary = summary_llm.invoke(
            f"Summarize this interaction in one sentence: User: {user_input}\nAI: {output}"
        ).content
        ep_mem.add_episodic_memory(user_id, summary)

        # Semantic
        extraction_prompt = f"Extract entities and facts from this interaction: User: {user_input}\nAI: {output}"
        kg_data = extraction_llm.invoke(extraction_prompt)
        sem_mem.add_semantic_facts(user_id, kg_data)

        # 3. Check for KU Notes (Agent implicitly saves hints/mnemonics)
        from pydantic import BaseModel, Field
        class NoteExtraction(BaseModel):
            has_note: bool = Field(description="True if the AI provided a specific mnemonic or helpful learning trick about a Japanese character.")
            character_or_slug: Optional[str] = Field(description="The specific Japanese character or slug the note is about, if any.")
            note_content: Optional[str] = Field(description="The concise learning trick or mnemonic provided.")
            
        note_extractor = make_llm().with_structured_output(NoteExtraction)
        note_check = note_extractor.invoke(
            f"Review this AI response carefully.\nDid the AI provide a specific memory trick, mnemonic, or important usage note about a specific Japanese character?\n\nAI Response: {output}"
        )
        
        if note_check and note_check.has_note and note_check.character_or_slug and note_check.note_content:
            from ..services.learning_service import search_kus, add_ku_note
            # Find the actual KU ID
            candidates = search_kus(note_check.character_or_slug, limit=1)
            if candidates:
                ku_id = str(candidates[0]["id"])
                add_ku_note(user_id, ku_id, note_check.note_content)
                logger.info(f"Saved implicit KU note for {note_check.character_or_slug}")

    except Exception as e:
        logger.error(f"Memory persistence failed: {e}")

    return {}


# ---------------------------------------------------------------------------
# Graph Compilation
# ---------------------------------------------------------------------------


def should_continue(state: AgentState):
    """Router for the planner -> tool node path."""
    last_msg = state["messages"][-1]
    if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
        return "tools"
    return "reviewer"


def decide_path(state: AgentState):
    """Router for the reviewer output."""
    if state.get("review_result") == "rewrite":
        return "rewrite"
    return "generate"


def _build_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("planner", planner_node)
    workflow.add_node("tools", tools_node)
    workflow.add_node("reviewer", reviewer_node)
    workflow.add_node("rewrite", rewriter_node)
    workflow.add_node("generate", generator_node)
    workflow.add_node("tts", tts_node)
    workflow.add_node("update", update_memory_node)

    workflow.set_entry_point("planner")

    # Conditional edge after planner
    workflow.add_conditional_edges(
        "planner", should_continue, {"tools": "tools", "reviewer": "reviewer"}
    )

    # After tools always go back to planner to evaluate results
    workflow.add_edge("tools", "planner")

    # After reviewer decide rewrite or generate
    workflow.add_conditional_edges(
        "reviewer", decide_path, {"rewrite": "rewrite", "generate": "generate"}
    )

    # After rewrite go back to planner
    workflow.add_edge("rewrite", "planner")

    # Parallel path: Generation branches into TTS and Update simultaneously
    workflow.add_edge("generate", "tts")
    workflow.add_edge("generate", "update")
    
    # Both parallel branches go to END
    workflow.add_edge("tts", END)
    workflow.add_edge("update", END)

    return workflow.compile()


memory_agent = _build_graph()

# ---------------------------------------------------------------------------
# Public Entry Point (Compatibility layer)
# ---------------------------------------------------------------------------


def run_chat(
    user_id: str,
    message: str,
    session_id: Optional[str] = None,
    tts_enabled: bool = True,
) -> Dict[str, Any]:
    """Invoke the iterative memory-augmented agent."""

    # Initialize state
    initial_state = {
        "user_id": user_id,
        "session_id": session_id,
        "user_input": message,
        "messages": [HumanMessage(content=message)],
        "iterations": 0,
        "generation": "",
        "audio_file": None,
        "tts_enabled": tts_enabled,
        "thread_context": "",
        "retrieved_episodic": "",
        "retrieved_semantic": "",
    }

    result = memory_agent.invoke(initial_state)

    # Extract metadata for returning to the frontend if needed
    # (Note: In this iterative version, we'd need to parse ToolMessages to populate these fields perfectly)
    return {
        "response": result["generation"],
        "audio_file": result.get("audio_file"),
        "episodic_context": "Retrieved via agentic tools",
        "semantic_context": "Retrieved via agentic tools",
        "thread_context": "Dynamic",
    }
