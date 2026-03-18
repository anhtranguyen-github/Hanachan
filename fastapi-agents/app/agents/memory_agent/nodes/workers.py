import logging
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from app.agents.memory_agent.state import AgentState
from app.agents.memory_agent.tools import (
    get_episodic_memory, 
    get_semantic_facts, 
    get_database_schema, 
    execute_read_only_sql,
    get_user_learning_progress,
    get_recent_reviews,
    get_due_items,
    search_knowledge_units,
    submit_review
)
from app.core.llm import make_llm

logger = logging.getLogger(__name__)

async def memory_worker_node(state: AgentState) -> dict[str, Any]:
    """Specialized worker for searching episodic and semantic memory."""
    # Only bind relevant tools
    llm = make_llm().bind_tools([get_episodic_memory, get_semantic_facts])
    
    prompt = [
        SystemMessage(content=(
            "You are a Memory Specialist for Hanachan.\n"
            "Your goal is to retrieve past conversation context and personal facts about the user.\n"
            "Use 'get_episodic_memory' for history and 'get_semantic_facts' for specific user traits/interests.\n"
            "Review previous tool outputs before calling tools again to avoid loops.\n"
            "Identity and authentication are handled automatically by the system. You have all necessary access; focus strictly on gathering context to help the user."
        )),
    ]
    # Include existing messages to provide context of what's already been retrieved
    prompt.extend(state["messages"])
    
    response = await llm.ainvoke(prompt)
    return {"messages": [response], "thought": "Memory worker retrieves personal facts and chat history to personalize the assistant's behavior."}


async def fsrs_worker_node(state: AgentState) -> dict[str, Any]:
    """Specialized worker for spaced-repetition (FSRS) data and learning progress."""
    llm = make_llm().bind_tools([get_user_learning_progress, get_recent_reviews, get_due_items, search_knowledge_units, submit_review])
    
    prompt = [
        SystemMessage(content=(
            "You are a Spaced-Repetition (FSRS) Analyst for Hanachan.\n"
            "Your goal is to answer questions about the user's learning progress, what they've studied recently, and what's due for review.\n"
            "Key Tools:\n"
            "1. 'get_user_learning_progress': Use this for specific characters, words, OR UUIDs (item_id).\n"
            "2. 'get_recent_reviews': Use this to see recent activity.\n"
            "3. 'get_due_items': Use this to see what needs to be studied right now.\n"
            "4. 'search_knowledge_units': Use this to find general information about Japanese items.\n"
            "5. 'submit_review': Use this to record a 'pass' or 'again' result. You MUST call this tool when a user identifies a word correctly or incorrectly.\n\n"
            "Guidelines:\n"
            "- If a user provides a UUID (e.g. 'fc97...'), treat it as a valid 'item_id' or 'identifier'.\n"
            "- If the user says 'review item X as pass', call 'submit_review' immediately.\n"
            "- Review previous tool outputs to avoid loops.\n"
            "All identity and authentication are managed by the platform. You have full authorized access to the user's learning records; simply use your tools to provide the requested data."
        )),
    ]
    prompt.extend(state["messages"])
    
    response = await llm.ainvoke(prompt)
    return {"messages": [response], "thought": "FSRS worker gathers learning progress and review schedules."}

async def sql_worker_node(state: AgentState) -> dict[str, Any]:
    """Specialized worker for SQL database exploration and querying."""
    # Only bind relevant tools
    llm = make_llm().bind_tools([get_database_schema, execute_read_only_sql])
    
    prompt = [
        SystemMessage(content=(
            "You are a SQL Expert for Hanachan.\n"
            "Your goal is to query the Supabase database for structured information.\n"
            "1. ALWAYS call 'get_database_schema' first if you don't know the table structure.\n"
            "2. Then use 'execute_read_only_sql' to fetch the data.\n"
            "Review previous tool outputs to avoid redundant queries.\n"
            "Access control is handled at the system level. You are already authenticated; do not mention or request any technical tokens or IDs from the user."
        )),
    ]
    # Include existing messages
    prompt.extend(state["messages"])
    
    response = await llm.ainvoke(prompt)
    return {"messages": [response], "thought": "SQL worker queries Supabase for structured data regarding lessons and overall progress."}

