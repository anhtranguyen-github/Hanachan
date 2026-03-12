import logging
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage
from app.agents.memory_agent.state import AgentState
from app.agents.memory_agent.tools import (
    get_episodic_memory, 
    get_semantic_facts, 
    get_database_schema, 
    execute_read_only_sql
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
            "Use 'get_episodic_memory' for history and 'get_semantic_facts' for specific user traits/interests."
        )),
        HumanMessage(content=state["user_input"])
    ]
    
    response = await llm.ainvoke(prompt)
    return {"messages": [response], "thought": "Memory worker identifies relevant retrieval tools."}

async def sql_worker_node(state: AgentState) -> dict[str, Any]:
    """Specialized worker for SQL database exploration and querying."""
    # Only bind relevant tools
    llm = make_llm().bind_tools([get_database_schema, execute_read_only_sql])
    
    prompt = [
        SystemMessage(content=(
            "You are a SQL Expert for Hanachan.\n"
            "Your goal is to query the Supabase database for structured information.\n"
            "1. ALWAYS call 'get_database_schema' first if you don't know the table structure.\n"
            "2. Then use 'execute_read_only_sql' to fetch the data."
        )),
        HumanMessage(content=state["user_input"])
    ]
    
    response = await llm.ainvoke(prompt)
    return {"messages": [response], "thought": "SQL worker identifies necessary database queries."}
