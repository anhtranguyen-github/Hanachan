"""
FSRS-Enhanced Memory Agent
Extends the base memory agent with:
- FSRS-based lesson delivery and review prompts
- Sentence library tools
- Video learning integration
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional, Annotated
from typing_extensions import TypedDict

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage, AIMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END

from ..core.llm import make_llm
from ..services.fsrs_service import get_fsrs_service
from ..services.sentence_library import (
    get_sentence_library_service,
    SentenceCreate,
)
from ..services.video_embeddings import get_video_embeddings_service
from ..services.memory import session_memory as sess_mem
from ..services import learning_service as learn_serv
from .memory_agent import (
    TOOLS as BASE_TOOLS
)
from .deck_manager import DECK_TOOLS

logger = logging.getLogger(__name__)


# -----------------------------------------------------------------------------
# Extended Agent State
# -----------------------------------------------------------------------------

class FSRSAgentState(TypedDict):
    """Extended agent state with FSRS and learning management."""
    # Base fields
    user_id: str
    session_id: Optional[str]
    user_input: str
    messages: Annotated[List[BaseMessage], lambda x, y: x + y]
    plan: str
    iterations: int
    review_result: str
    rewritten_query: Optional[str]
    generation: str
    audio_file: Optional[str]
    tts_enabled: bool
    thread_context: str
    retrieved_episodic: str
    retrieved_semantic: str
    
    # FSRS fields
    mode: str  # 'auto', 'teach', 'review', 'mixed'
    due_reviews: List[Dict[str, Any]]
    learning_summary: Dict[str, Any]
    
    # Lesson/Review state
    current_item: Optional[Dict[str, Any]]
    session_type: Optional[str]  # 'lesson', 'review', 'chat'
    items_presented: int
    items_completed: int


# -----------------------------------------------------------------------------
# New Tools for Sentences and Videos
# -----------------------------------------------------------------------------

@tool
def save_sentence_to_library(
    japanese: str,
    english: str,
    source_type: str = "chat",
    source_id: Optional[str] = None,
    furigana: Optional[str] = None,
    tags: Optional[List[str]] = None,
    category: str = "general",
    notes: Optional[str] = None,
    user_id: str = "INJECTED"
) -> str:
    """
    Save a Japanese sentence to the user's personal sentence library.
    Use this when the user expresses interest in a sentence or wants to remember it.
    
    Args:
        japanese: The Japanese sentence
        english: English translation
        source_type: Where this came from ('chat', 'video', 'reading', 'manual')
        source_id: Optional ID of the source (e.g., video ID)
        furigana: Optional furigana reading
        tags: Optional tags for organization
        category: Category for grouping
        notes: Optional personal notes
    """
    try:
        service = get_sentence_library_service()
        
        sentence_data = SentenceCreate(
            japanese=japanese,
            english=english,
            furigana=furigana,
            source_type=source_type,
            source_id=source_id,
            tags=tags or [],
            category=category,
            notes=notes
        )
        
        sentence = service.create_sentence(user_id, sentence_data)
        
        return (
            f"Saved sentence to your library! ID: {sentence.id}\n"
            f"Japanese: {sentence.japanese}\n"
            f"English: {sentence.english}"
        )
    except Exception as e:
        return f"Failed to save sentence: {str(e)}"


@tool
def search_sentence_library(
    query: str,
    semantic: bool = True,
    limit: int = 5,
    user_id: str = "INJECTED"
) -> str:
    """
    Search the user's sentence library.
    Can do semantic search (meaning-based) or simple text search.
    
    Args:
        query: Search query - can be Japanese, English, or meaning description
        semantic: If True, uses AI to understand meaning; if False, simple text match
        limit: Max results to return
    """
    try:
        service = get_sentence_library_service()
        
        if semantic:
            results = service.semantic_search(user_id, query, limit=limit)
            if not results:
                return "No similar sentences found in your library."
            
            lines = [f"Found {len(results)} similar sentences:"]
            for r in results:
                s = r.sentence
                sim_pct = int(r.similarity_score * 100)
                lines.append(f"\n[Match: {sim_pct}%] {s.japanese}")
                lines.append(f"  → {s.english}")
                if s.notes:
                    lines.append(f"  Notes: {s.notes}")
            return "\n".join(lines)
        else:
            sentences, total = service.list_sentences(
                user_id, search_query=query, limit=limit
            )
            if not sentences:
                return "No sentences found matching your query."
            
            lines = [f"Found {total} sentences:"]
            for s in sentences:
                lines.append(f"\n{s.japanese}")
                lines.append(f"  → {s.english}")
                if s.category:
                    lines.append(f"  Category: {s.category}")
            return "\n".join(lines)
    except Exception as e:
        return f"Search failed: {str(e)}"


@tool
def analyze_sentence(sentence: str, user_id: str = "INJECTED") -> str:
    """
    Analyze a Japanese sentence for grammar, vocabulary, and difficulty.
    Returns detailed breakdown including JLPT level and featured vocabulary.
    
    Args:
        sentence: Japanese sentence to analyze
    """
    try:
        service = get_sentence_library_service()
        analysis = service.analyze_sentence(sentence, user_id)
        
        lines = [
            "Sentence Analysis:",
            f"Japanese: {analysis.japanese}",
            f"Estimated JLPT Level: N{analysis.jlpt_level}",
            f"Difficulty Score: {analysis.difficulty_score}/100",
            "",
            f"Tokens ({len(analysis.tokens)}):"
        ]
        
        for token in analysis.tokens[:10]:  # Limit output
            ku_info = ""
            if token.get('ku_id'):
                ku_info = f" [KU: {token.get('ku_id', 'N/A')}]"
            lines.append(
                f"  • {token['surface']} ({token['reading']}) - {token['pos']}{ku_info}"
            )
        
        if analysis.tokens[10:]:
            lines.append(f"  ... and {len(analysis.tokens) - 10} more")
        
        if analysis.grammar_points:
            lines.append("\nDetected Grammar Patterns:")
            for gp in analysis.grammar_points[:5]:
                lines.append(f"  • {gp['pattern']}")
        
        if analysis.featured_ku_ids:
            lines.append(
                f"\nFeatured Vocabulary: {len(analysis.featured_ku_ids)} items"
            )
        
        return "\n".join(lines)
    except Exception as e:
        return f"Analysis failed: {str(e)}"


@tool
def get_sentences_for_lesson(
    target_ku: str,
    limit: int = 3,
    user_id: str = "INJECTED"
) -> str:
    """
    Get example sentences featuring a specific knowledge unit (kanji, vocab, grammar).
    Useful for teaching new content with context.
    
    Args:
        target_ku: The kanji, word, or grammar point to find sentences for
        limit: Number of sentences to return
    """
    try:
        # First find the KU
        ku_results = learn_serv.search_kus(target_ku, limit=1)
        if not ku_results:
            return f"Could not find knowledge unit for '{target_ku}'"
        
        ku = ku_results[0]
        ku_id = str(ku["id"])
        
        # Get sentences from library
        service = get_sentence_library_service()
        sentences = service.get_lesson_sentences(user_id, [ku_id], limit=limit)
        
        if not sentences:
            return (
                f"No example sentences found in library for "
                f"{ku['character']} ({ku['meaning']})."
            )
        
        lines = [
            f"Example sentences for {ku['character']} ({ku['meaning']}):",
            ""
        ]
        
        for i, s in enumerate(sentences, 1):
            lines.append(f"{i}. {s.japanese}")
            lines.append(f"   {s.english}")
            if s.notes:
                lines.append(f"   💡 {s.notes}")
            lines.append("")
        
        return "\n".join(lines)
    except Exception as e:
        return f"Failed to get sentences: {str(e)}"


@tool
def search_videos(
    query: str,
    jlpt_level: Optional[int] = None,
    limit: int = 5,
    user_id: str = "INJECTED"
) -> str:
    """
    Search for videos by semantic similarity to your query.
    Great for finding videos about specific topics or vocabulary.
    
    Args:
        query: What to search for (topic, vocabulary, grammar point)
        jlpt_level: Optional JLPT level filter (1-5)
        limit: Max results
    """
    try:
        service = get_video_embeddings_service()
        results = service.search_videos(query, user_id, jlpt_level, limit)
        
        if not results:
            return (
                f"No videos found matching '{query}'. "
                f"Try a different query or remove filters."
            )
        
        lines = [f"Found {len(results)} videos:\n"]
        
        for r in results:
            jlpt_info = ""
            if r.jlpt_level:
                jlpt_info = f" [N{r.jlpt_level}]"
            sim_pct = int(r.similarity_score * 100)
            
            lines.append(f"📺 {r.title}{jlpt_info} (Match: {sim_pct}%)")
            if r.channel_name:
                lines.append(f"   Channel: {r.channel_name}")
            if r.description:
                if len(r.description) > 100:
                    desc = r.description[:100] + "..."
                else:
                    desc = r.description
                lines.append(f"   {desc}")
            lines.append("")
        
        return "\n".join(lines)
    except Exception as e:
        return f"Video search failed: {str(e)}"


@tool
def get_video_learning_segments(
    video_id: str,
    target_vocabulary: str,
    user_id: str = "INJECTED"
) -> str:
    """
    Get specific video segments containing target vocabulary.
    Useful for focused learning from video content.
    
    Args:
        video_id: The video ID
        target_vocabulary: Comma-separated list of words/kanji to find
    """
    try:
        # Parse target vocabulary into KU IDs
        vocab_items = [v.strip() for v in target_vocabulary.split(",")]
        ku_ids = []
        
        for vocab in vocab_items:
            ku_results = learn_serv.search_kus(vocab, limit=1)
            if ku_results:
                ku_ids.append(str(ku_results[0]["id"]))
        
        if not ku_ids:
            return f"Could not find knowledge units for: {target_vocabulary}"
        
        service = get_video_embeddings_service()
        segments = service.get_video_segments_for_learning(video_id, ku_ids)
        
        if not segments:
            return "No segments found with the target vocabulary in this video."
        
        lines = [f"Found {len(segments)} learning segments:\n"]
        
        for i, seg in enumerate(segments[:5], 1):  # Limit output
            target = seg["target"]
            start_sec = seg["start_time"] // 1000
            
            lines.append(f"{i}. [{start_sec}s] {target['text']}")
            
            if seg["context_before"]:
                ctx = seg["context_before"][-1]
                lines.append(f"   ← Context: {ctx['text']}")
            
            if seg["context_after"]:
                ctx = seg["context_after"][0]
                lines.append(f"   → Next: {ctx['text']}")
            
            lines.append("")
        
        return "\n".join(lines)
    except Exception as e:
        return f"Failed to get segments: {str(e)}"


@tool
def get_due_reviews(user_id: str = "INJECTED", limit: int = 5) -> str:
    """
    Get items due for review based on FSRS scheduling.
    Returns a summary of what's due today.
    
    Args:
        limit: Maximum number of items to show
    """
    try:
        service = get_fsrs_service()
        due_items = service.get_due_items(user_id, limit=limit)
        
        if not due_items:
            summary = service.get_learning_summary(user_id)
            learning_count = summary["by_state"].get("learning", 0)
            review_count = summary["by_state"].get("review", 0)
            total_learned = learning_count + review_count
            
            if total_learned == 0:
                return (
                    "You haven't started learning yet! "
                    "Let me teach you some new content."
                )
            
            return (
                "Great job! Nothing is due for review right now. "
                "You're all caught up! 🎉"
            )
        
        lines = [f"You have {len(due_items)} items due for review:\n"]
        
        for item in due_items[:limit]:
            if item.item_type == "sentence":
                item_type = "📝"
            elif item.item_type == "ku":
                item_type = "📚"
            else:
                item_type = "📺"
            if item.priority_score > 1:
                due_info = "Due now!"
            else:
                due_info = f"Due in {int(item.interval_days)} days"
            lines.append(f"{item_type} {item.item_id} - {due_info}")
        
        lines.append("\nWould you like to start a review session?")
        return "\n".join(lines)
    except Exception as e:
        return f"Failed to get reviews: {str(e)}"


@tool
def should_teach_or_review(user_id: str = "INJECTED") -> str:
    """
    Check whether the user should learn new content or review existing items.
    This considers their current learning state and due reviews.
    
    Returns a recommendation with reasoning.
    """
    try:
        service = get_fsrs_service()
        action, details = service.should_teach_or_review(user_id)
        
        lines = [
            f"Learning Recommendation: {action.upper()}",
            f"Reason: {details['reason']}",
            ""
        ]
        
        if action == "review":
            lines.append(f"📚 You have {details['due_count']} items due for review.")
            lines.append(f"Suggested: Review {details['suggested_reviews']} items")
        elif action == "teach":
            lines.append(
                f"📖 Your knowledge base has {details['review_count']} items in review."
            )
            lines.append(f"Suggested: Learn {details['suggested_new']} new items")
        else:  # mixed
            lines.append(f"📚 Due for review: {details.get('due_count', 0)}")
            if 'learning_count' in details:
                lines.append(f"📝 In learning: {details['learning_count']}")
            lines.append(
                f"Suggested: Review some, then learn {details['suggested_new']} new"
            )
        
        return "\n".join(lines)
    except Exception as e:
        return f"Recommendation failed: {str(e)}"


# Extended tools list
FSRS_TOOLS = BASE_TOOLS + [
    save_sentence_to_library,
    search_sentence_library,
    analyze_sentence,
    get_sentences_for_lesson,
    search_videos,
    get_video_learning_segments,
    get_due_reviews,
    should_teach_or_review,
] + DECK_TOOLS


# -----------------------------------------------------------------------------
# FSRS Nodes
# -----------------------------------------------------------------------------

PLANNER_PROMPT_FSRS = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            (
                "You are Hanachan, a strategic Japanese language learning "
                "assistant with FSRS-based scheduling.\n"
                "Your goal is to help users learn efficiently by balancing "
                "new content with spaced repetition reviews.\n\n"
                "User session context:\n{thread_context}\n\n"
                "Learning Mode: {mode}\n"
                "Due Reviews: {due_count}\n\n"
                "Instructions:\n"
                "1. Analyze the user's message.\n"
                "2. If they want to learn new content, use tools to find "
                "appropriate material.\n"
                "3. If they have items due for review, prioritize those.\n"
                "4. Use sentence library tools to find or save examples.\n"
                "5. Use video search to find relevant immersion content.\n"
                "6. Call should_teach_or_review if unsure what to do next.\n"
                "7. Use get_due_reviews to check what needs review.\n"
                "8. Use get_sentences_for_lesson when teaching specific "
                "vocabulary.\n"
                "9. Use deck tools (create_user_deck, add_to_deck, etc.) "
                "when the user wants to manage their custom collections.\n\n"
                "Current Date: {date}"
            ),
        ),
        ("placeholder", "{messages}"),
    ]
)


def fsrs_planner_node(state: FSRSAgentState) -> Dict[str, Any]:
    """Extended planner with FSRS awareness."""
    llm = make_llm().bind_tools(FSRS_TOOLS)
    
    # Pre-fetch thread context
    thread_text = (
        sess_mem.get_thread_context_text(state["session_id"], last_n=5)
        if state.get("session_id")
        else "No active session."
    )
    
    # Get learning state
    due_count = len(state.get("due_reviews", []))
    mode = state.get("mode", "auto")
    
    chain = PLANNER_PROMPT_FSRS | llm
    response = chain.invoke(
        {
            "messages": state["messages"],
            "thread_context": thread_text,
            "mode": mode,
            "due_count": due_count,
            "date": datetime.now().strftime("%Y-%m-%d"),
        }
    )
    
    return {"messages": [response], "iterations": state.get("iterations", 0) + 1}


def lesson_delivery_node(state: FSRSAgentState) -> Dict[str, Any]:
    """
    Node for delivering new lesson content.
    Presents vocabulary, sentences, and context for learning.
    """
    user_id = state["user_id"]
    
    # Get items to teach
    # This would integrate with curriculum to find appropriate next items
    ku_results = learn_serv.search_kus("beginner", limit=3)
    
    lines = ["📚 Let's learn something new!\n"]
    
    for ku in ku_results:
        lines.append(f"\n**{ku['character']}** ({ku['meaning']})")
        lines.append(f"Type: {ku['type']} | Level: {ku['level']}")
        
        # Get example sentences
        service = get_sentence_library_service()
        sentences = service.get_lesson_sentences(user_id, [str(ku["id"])], limit=2)
        
        if sentences:
            lines.append("\nExamples:")
            for s in sentences:
                lines.append(f"  • {s.japanese}")
                lines.append(f"    → {s.english}")
        
        lines.append("")
    
    content = "\n".join(lines)
    
    return {
        "messages": [AIMessage(content=content)],
        "session_type": "lesson",
        "items_presented": state.get("items_presented", 0) + len(ku_results)
    }


def review_prompt_node(state: FSRSAgentState) -> Dict[str, Any]:
    """
    Node for prompting reviews based on FSRS schedule.
    Presents items due for review and asks for self-assessment.
    """
    user_id = state["user_id"]
    service = get_fsrs_service()
    
    # Get due items
    due_items = service.get_due_items(user_id, limit=5)
    
    if not due_items:
        return {
            "messages": [AIMessage(
                content=(
                    "🎉 Nothing due for review! "
                    "Great job keeping up with your studies."
                )
            )],
            "due_reviews": []
        }
    
    lines = [f"📚 Time for review! You have {len(due_items)} items due.\n"]
    lines.append("I'll show you each item. Try to recall it, then rate yourself:\n")
    lines.append("- **Again** (1): Forgot completely")
    lines.append("- **Hard** (2): Remembered with difficulty")
    lines.append("- **Good** (3): Remembered easily")
    lines.append("- **Easy** (4): Remembered instantly\n")
    
    for i, item in enumerate(due_items[:3], 1):
        lines.append(f"{i}. Item: {item.item_id} ({item.item_type})")
        lines.append(f"   Due: {item.due_date.strftime('%Y-%m-%d')}")
        lines.append("")
    
    content = "\n".join(lines)
    
    return {
        "messages": [AIMessage(content=content)],
        "due_reviews": [item.model_dump() for item in due_items],
        "session_type": "review"
    }


def teach_or_review_decision_node(state: FSRSAgentState) -> Dict[str, Any]:
    """
    Node that decides whether to teach new content or prompt for reviews.
    """
    user_id = state["user_id"]
    service = get_fsrs_service()
    
    action, details = service.should_teach_or_review(user_id)
    
    # Update state with decision
    return {
        "mode": action,
        "learning_summary": details
    }


def fsrs_tools_node(state: FSRSAgentState) -> Dict[str, Any]:
    """Extended tools node that handles all FSRS tools."""
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
            "append_to_learning_notes",
            "save_sentence_to_library",
            "search_sentence_library",
            "analyze_sentence",
            "get_sentences_for_lesson",
            "search_videos",
            "get_video_learning_segments",
            "get_due_reviews",
            "should_teach_or_review",
            "create_user_deck",
            "list_my_decks",
            "add_to_deck",
            "remove_from_deck",
            "view_deck_contents",
        ]:
            args["user_id"] = user_id
        
        # Find and invoke tool
        tool_map = {t.name: t for t in FSRS_TOOLS}
        if tool_name in tool_map:
            content = tool_map[tool_name].invoke(args)
            results.append(
                ToolMessage(
                    tool_call_id=tool_call["id"],
                    content=str(content),
                    name=tool_name
                )
            )
    
    return {"messages": results}


# -----------------------------------------------------------------------------
# Graph Construction
# -----------------------------------------------------------------------------

def should_continue_fsrs(state: FSRSAgentState):
    """Router for the planner -> tool node path."""
    last_msg = state["messages"][-1]
    if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
        return "tools"
    return "reviewer"


def decide_teaching_path(state: FSRSAgentState):
    """Decide which learning path to take."""
    mode = state.get("mode", "auto")
    due_reviews = state.get("due_reviews", [])
    
    if mode == "review" or len(due_reviews) >= 5:
        return "review"
    elif mode == "teach":
        return "lesson"
    else:
        # Mixed - could use logic based on user's recent activity
        return "lesson" if not due_reviews else "review"


def build_fsrs_graph():
    """Build the FSRS-enhanced agent graph."""
    workflow = StateGraph(FSRSAgentState)
    
    # Add nodes
    workflow.add_node("planner", fsrs_planner_node)
    workflow.add_node("tools", fsrs_tools_node)
    workflow.add_node(
        "reviewer",
        lambda state: {"review_result": "generate"}  # Simplified
    )
    workflow.add_node("lesson_delivery", lesson_delivery_node)
    workflow.add_node("review_prompt", review_prompt_node)
    workflow.add_node("decision", teach_or_review_decision_node)
    
    # Set entry point
    workflow.set_entry_point("planner")
    
    # Planner -> Tools or Decision
    workflow.add_conditional_edges(
        "planner",
        should_continue_fsrs,
        {"tools": "tools", "reviewer": "decision"}
    )
    
    # Tools -> Planner
    workflow.add_edge("tools", "planner")
    
    # Decision -> Lesson or Review
    workflow.add_conditional_edges(
        "decision",
        decide_teaching_path,
        {"lesson": "lesson_delivery", "review": "review_prompt"}
    )
    
    # Both paths end
    workflow.add_edge("lesson_delivery", END)
    workflow.add_edge("review_prompt", END)
    
    return workflow.compile()


# Create the graph
fsrs_enhanced_agent = build_fsrs_graph()


# -----------------------------------------------------------------------------
# Public Entry Point
# -----------------------------------------------------------------------------

def run_fsrs_chat(
    user_id: str,
    message: str,
    session_id: Optional[str] = None,
    mode: str = "auto",
    tts_enabled: bool = True,
) -> Dict[str, Any]:
    """
    Invoke the FSRS-enhanced agent.
    
    Args:
        user_id: User ID
        message: User message
        session_id: Optional session ID
        mode: 'auto', 'teach', 'review', or 'mixed'
        tts_enabled: Whether to generate TTS audio
    """
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
        "mode": mode,
        "due_reviews": [],
        "learning_summary": {},
        "current_item": None,
        "session_type": None,
        "items_presented": 0,
        "items_completed": 0,
    }
    
    result = fsrs_enhanced_agent.invoke(initial_state)
    
    return {
        "output": result["messages"][-1].content if result["messages"] else "",
        "mode": result.get("mode", "auto"),
        "session_type": result.get("session_type"),
        "items_presented": result.get("items_presented", 0),
    }
