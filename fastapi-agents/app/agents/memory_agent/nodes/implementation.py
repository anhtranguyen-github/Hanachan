import logging
import os
from datetime import datetime
from typing import Any

from langchain_core.messages import HumanMessage, ToolMessage
from langchain_core.prompts import ChatPromptTemplate
from pydantic import BaseModel, Field

from app.agents.memory_agent.state import AgentState
from app.agents.memory_agent.tools import TOOLS
from app.core.llm import make_llm
from app.schemas.memory import KnowledgeGraph
from app.services.memory import episodic_memory as ep_mem
from app.services.memory import semantic_memory as sem_mem

logger = logging.getLogger(__name__)

async def tools_node(state: AgentState) -> dict[str, Any]:
    """Custom tool node that injects the actual user_id from state into tool calls."""
    user_id = state["user_id"]
    last_msg = state["messages"][-1]
    tool_map = {t.name: t for t in TOOLS}

    if not last_msg.tool_calls:
        return {"messages": []}

    results = []
    for tool_call in last_msg.tool_calls:
        tool_name = tool_call["name"]
        args = tool_call["args"]

        if tool_name not in tool_map:
            continue

        # Inject user_id and jwt if needed
        if tool_name in [
            "get_episodic_memory",
            "get_semantic_facts",
            "get_user_learning_progress",
            "get_recent_reviews",
            "search_knowledge_units",
            "append_to_learning_notes",
            "create_user_deck",
            "list_my_decks",
            "add_to_deck",
            "remove_from_deck",
            "view_deck_contents",
            "submit_reading_answer",
        ]:
            if "user_id" in tool_map[tool_name].args:
                args["user_id"] = user_id
            if "jwt" in tool_map[tool_name].args:
                args["jwt"] = state["jwt"]

        # Invoke (LangChain handles sync/async internally via ainvoke)
        target_tool = tool_map[tool_name]
        try:
            content = await target_tool.ainvoke(args)
                
            results.append(
                ToolMessage(
                    tool_call_id=tool_call["id"], content=str(content), name=tool_name
                )
            )
        except Exception as e:
            logger.error(f"Error in tool {tool_name}: {e}")
            results.append(
                ToolMessage(
                    tool_call_id=tool_call["id"], content=f"Error: {str(e)}", name=tool_name
                )
            )

    return {"messages": results}

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
            "7. If the user explicitly asks you to save or remember a note for a specific kanji/vocab/grammar, use 'append_to_learning_notes'.\n"
            "8. If the user wants to create, list, view, or manage their study decks, use the appropriate 'deck' tools.\n"
            "9. If you have already gathered info, decide if you need more or if you can proceed to answer.\n\n"
            "Current Date: {date}",
        ),
        ("placeholder", "{messages}"),
    ]
)

async def planner_node(state: AgentState) -> dict[str, Any]:
    """Decides what the agent should do next (call tools or generate)."""
    llm = make_llm().bind_tools(TOOLS)

    # Pre-fetch thread context for the prompt (via Domain Service)
    thread_text = "(no active session)"
    if state.get("session_id"):
        from app.core.domain_client import DomainClient
        client = DomainClient(state["jwt"])
        try:
            messages = await client.get_chat_messages(state["session_id"])
            recent = messages[-5:]
            lines = []
            for m in recent:
                prefix = "User" if m["role"] == "user" else "Assistant"
                lines.append(f"{prefix}: {m['content']}")
            thread_text = "\n".join(lines)
        except Exception:
            thread_text = "Failed to retrieve session context."

    chain = PLANNER_PROMPT | llm
    response = chain.invoke(
        {
            "messages": state["messages"],
            "thread_context": thread_text,
            "date": datetime.now().strftime("%Y-%m-%d"),
        }
    )

    thought = "Thinking about next steps..."
    if hasattr(response, "tool_calls") and response.tool_calls:
        tool_names = [tc["name"] for tc in response.tool_calls]
        thought = f"I decided to use these tools: {tool_names}"
    else:
        thought = "I have enough information to answer directly."

    return {
        "messages": [response], 
        "iterations": state.get("iterations", 0) + 1,
        "thought": thought
    }

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

def reviewer_node(state: AgentState) -> dict[str, Any]:
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
        thought = "The gathered information is sufficient. Proceeding to answer."
        return {"review_result": "generate", "thought": thought}
    else:
        # Extract suggested rewrite if present
        suggestion = content.replace("REWRITE", "").strip()
        thought = f"The information is incomplete. I need to search again: {suggestion}"
        return {"review_result": "rewrite", "rewritten_query": suggestion, "thought": thought}

def rewriter_node(state: AgentState) -> dict[str, Any]:
    """Modifies the message list to guide the planner towards a better tool call."""
    suggestion = state.get("rewritten_query", "Try searching for simpler keywords.")
    return {
        "messages": [
            HumanMessage(
                content=f"[Reviewer Feedback]: The previous tools didn't find enough. {suggestion}"
            )
        ],
        "thought": "I'm rewriting the query to improve context retrieval."
    }

GENERATION_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are Hanachan, a helpful and personalized Japanese learning assistant.\n"
            "Use the retrieved context to answer the user. Be concise, warm, and professional.\n"
            "Reference the facts found if relevant, but don't show raw metadata.\n\n"
            "Context:\\n{messages}",
        ),
        ("human", "{user_input}"),
    ]
)

def generator_node(state: AgentState) -> dict[str, Any]:
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
    logger.debug(
        f"generator_context: {messages_text}"
    )

    response = chain.invoke(
        {"user_input": state["user_input"], "messages": messages_text}
    )

    return {"generation": response.content, "thought": "Final answer generated."}

async def tts_node(state: AgentState) -> dict[str, Any]:
    """Generates voice for the final response using ElevenLabs SDK and stores it via Domain Service."""
    if not state.get("tts_enabled", True):
        return {"audio_file": None}
        
    if state.get("generation"):
        try:
            import uuid

            from elevenlabs.client import ElevenLabs

            from app.core.config import settings
            from app.core.domain_client import DomainClient
            client = ElevenLabs(api_key=settings.elevenlabs_api_key)
            
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
                client = DomainClient(state["jwt"])
                public_url = await client.upload_audio(temp_file)
                try:
                    os.remove(temp_file)
                except Exception as e:
                    logger.warning(f"Failed to delete temp audio file {temp_file}: {e}")
                return {"audio_file": public_url}
        except Exception as e:
            logger.error(f"ElevenLabs TTS failed: {e}")
            return {"audio_file": None}
    return {}

async def update_memory_node(state: AgentState) -> dict[str, Any]:
    """Final node to persist the side effects (episodic/semantic update) via Domain Service."""
    user_id = state["user_id"]
    jwt_token = state["jwt"]
    session_id = state.get("session_id")
    user_input = state["user_input"]
    output = state["generation"]

    from app.services.mcp_domain_client import MCPDomainClient
    client = MCPDomainClient(jwt_token)

    if session_id:
        try:
            await client.call_tool("upsert_chat_session", {"user_id": user_id, "session_id": session_id})
            existing_messages = await client.call_tool("get_chat_messages", {"user_id": user_id, "session_id": session_id})
            await client.call_tool("add_chat_message", {"user_id": user_id, "session_id": session_id, "role": "user", "content": user_input})
            await client.call_tool("add_chat_message", {"user_id": user_id, "session_id": session_id, "role": "assistant", "content": output})

            if not existing_messages or len(existing_messages) < 2:
                try:
                    title_llm = make_llm()
                    title_prompt = f"Generate a very short (max 5 words) title for this conversation in Japanese. User: {user_input}"
                    title_res = title_llm.invoke(title_prompt).content
                    title = title_res.strip().replace('"', '').replace('*', '')
                    await client.call_tool("update_chat_session", {"user_id": user_id, "session_id": session_id, "title": title})
                    logger.info(f"Generated title for session {session_id}: {title}")
                except Exception as te:
                    logger.error(f"Failed to generate title: {te}")
        except Exception as e:
            logger.error(f"Failed to persist chat_session or message via MCP: {e}")

    try:
        extraction_llm = make_llm().with_structured_output(KnowledgeGraph)
        summary_llm = make_llm()

        summary = summary_llm.invoke(
            f"Summarize this interaction in one sentence: User: {user_input}\nAI: {output}"
        ).content
        ep_mem.add_episodic_memory(user_id, summary)

        extraction_prompt = f"Extract entities and facts from this interaction: User: {user_input}\nAI: {output}"
        kg_data = extraction_llm.invoke(extraction_prompt)
        sem_mem.add_semantic_facts(user_id, kg_data)

        class NoteExtraction(BaseModel):
            has_note: bool = Field(description="True if the AI provided a specific mnemonic or helpful learning trick about a Japanese character.")
            character_or_slug: str | None = Field(description="The specific Japanese character or slug the note is about, if any.")
            note_content: str | None = Field(description="The concise learning trick or mnemonic provided.")
            
        note_extractor = make_llm().with_structured_output(NoteExtraction)
        note_check = note_extractor.invoke(
            f"Review this AI response carefully.\nDid the AI provide a specific memory trick, mnemonic, or important usage note about a specific Japanese character?\n\nAI Response: {output}"
        )
        
        if note_check and note_check.has_note and note_check.character_or_slug and note_check.note_content:
            logger.info("Skipped storing KU note due to architecture rules (use NextJS/Supabase).")
    except Exception as e:
        logger.error(f"Memory persistence failed: {e}")

    return {"thought": "Memories extracted and persisted to domain storage."}
