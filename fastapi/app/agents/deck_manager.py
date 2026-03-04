"""
Deck Manager Agent - handles user requests for creating and managing custom decks.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate

from ..core.supabase import supabase
from ..services import learning_service as learn_serv
from ..core.llm import make_llm

logger = logging.getLogger(__name__)


@tool
def create_user_deck(name: str, description: Optional[str] = None, user_id: str = "INJECTED") -> str:
    """
    Create a new custom deck for the user.
    
    Args:
        name: The name of the deck.
        description: An optional description of the deck's purpose.
    """
    try:
        data = {
            "user_id": user_id,
            "name": name,
            "description": description
        }
        result = supabase.table("decks").insert(data).execute()
        
        if not result.data:
            return "Failed to create deck: No data returned from Supabase."
            
        deck = result.data[0]
        return f"Successfully created deck '{deck['name']}' (ID: {deck['id']})."
    except Exception as e:
        logger.error(f"Error creating deck: {e}")
        return f"Failed to create deck: {str(e)}"


@tool
def list_my_decks(user_id: str = "INJECTED") -> str:
    """
    List all custom decks created by the user.
    """
    try:
        result = supabase.table("decks").select("*").eq("user_id", user_id).order("created_at", desc=True).execute()
        decks = result.data or []
        
        if not decks:
            return "You don't have any custom decks yet. Would you like to create one?"
        
        lines = ["Your custom decks:"]
        for d in decks:
            desc = f" - {d['description']}" if d['description'] else ""
            lines.append(f"• {d['name']} (ID: {d['id']}){desc}")
        return "\n".join(lines)
    except Exception as e:
        logger.error(f"Error listing decks: {e}")
        return f"Failed to list decks: {str(e)}"


@tool
def add_to_deck(
    deck_name_or_id: str, 
    item_identifier: str, 
    item_type: str, 
    user_id: str = "INJECTED"
) -> str:
    """
    Add an item to a specific deck.
    
    Args:
        deck_name_or_id: The name or UUID of the deck.
        item_identifier: The item to add. For 'ku', use character or slug. For others, use ID.
        item_type: Type of item ('ku', 'sentence', 'video').
    """
    try:
        # 1. Resolve deck
        deck_id = None
        # Try finding by exact UUID first
        import uuid
        try:
            uuid.UUID(deck_name_or_id)
            result = supabase.table("decks").select("id").eq("id", deck_name_or_id).eq("user_id", user_id).execute()
            if result.data:
                deck_id = result.data[0]["id"]
        except ValueError:
            pass
            
        if not deck_id:
            # Fallback to name search
            result = supabase.table("decks").select("id").eq("name", deck_name_or_id).eq("user_id", user_id).execute()
            if result.data:
                deck_id = result.data[0]["id"]
        
        if not deck_id:
            return f"Could not find a deck named or with ID '{deck_name_or_id}'."

        # 2. Resolve item_id if needed
        real_item_id = item_identifier
        if item_type == "ku":
            ku = learn_serv.get_ku_by_character(item_identifier)
            if not ku:
                ku = learn_serv.get_ku_by_slug(item_identifier)
            if not ku:
                return f"Could not find knowledge unit for '{item_identifier}'."
            real_item_id = str(ku["id"])
        
        # 3. Add to deck
        item_data = {
            "deck_id": deck_id,
            "item_id": real_item_id,
            "item_type": item_type
        }
        # ON CONFLICT handling in Supabase Python client via upsert
        supabase.table("deck_items").upsert(item_data, on_conflict="deck_id,item_id,item_type").execute()
        
        return f"Successfully added {item_type} '{item_identifier}' to deck."
    except Exception as e:
        logger.error(f"Error adding to deck: {e}")
        return f"Failed to add item to deck: {str(e)}"


@tool
def remove_from_deck(
    deck_name_or_id: str, 
    item_identifier: str, 
    item_type: str, 
    user_id: str = "INJECTED"
) -> str:
    """
    Remove an item from a specific deck.
    """
    try:
        # 1. Resolve deck
        deck_id = None
        import uuid
        try:
            uuid.UUID(deck_name_or_id)
            result = supabase.table("decks").select("id").eq("id", deck_name_or_id).eq("user_id", user_id).execute()
            if result.data:
                deck_id = result.data[0]["id"]
        except ValueError:
            pass
            
        if not deck_id:
            result = supabase.table("decks").select("id").eq("name", deck_name_or_id).eq("user_id", user_id).execute()
            if result.data:
                deck_id = result.data[0]["id"]
        
        if not deck_id:
            return f"Could not find a deck named '{deck_name_or_id}'."

        # 2. Resolve item_id
        real_item_id = item_identifier
        if item_type == "ku":
            ku = learn_serv.get_ku_by_character(item_identifier)
            if not ku:
                ku = learn_serv.get_ku_by_slug(item_identifier)
            if not ku:
                return f"Could not find knowledge unit for '{item_identifier}'."
            real_item_id = str(ku["id"])
        
        # 3. Remove
        result = supabase.table("deck_items") \
            .delete() \
            .eq("deck_id", deck_id) \
            .eq("item_id", real_item_id) \
            .eq("item_type", item_type) \
            .execute()
            
        if result.data:
            return f"Successfully removed {item_type} '{item_identifier}' from deck."
        return "Failed to remove item (maybe it wasn't in the deck?)"
    except Exception as e:
        logger.error(f"Error removing from deck: {e}")
        return f"Failed to remove item from deck: {str(e)}"


@tool
def view_deck_contents(deck_name_or_id: str, user_id: str = "INJECTED") -> str:
    """
    Show all items currently in a deck.
    """
    try:
        # Resolve deck and get details
        deck_id = None
        import uuid
        try:
            uuid.UUID(deck_name_or_id)
            result = supabase.table("decks").select("*, deck_items(*)").eq("id", deck_name_or_id).eq("user_id", user_id).execute()
        except ValueError:
            result = supabase.table("decks").select("*, deck_items(*)").eq("name", deck_name_or_id).eq("user_id", user_id).execute()
            
        if not result.data:
            return f"Could not find a deck named '{deck_name_or_id}'."

        deck = result.data[0]
        items = deck.get("deck_items", [])
        
        if not items:
            return f"The deck '{deck['name']}' is empty."
            
        lines = [f"Contents of '{deck['name']}':"]
        for item in items:
            label = item["item_id"]
            if item["item_type"] == "ku":
                # Fetch KU details
                ku_res = supabase.table("knowledge_units").select("character, meaning").eq("id", item["item_id"]).execute()
                if ku_res.data:
                    ku = ku_res.data[0]
                    label = f"{ku['character']} ({ku['meaning']})"

            lines.append(f"• [{item['item_type'].upper()}] {label}")
            
        return "\n".join(lines)
    except Exception as e:
        logger.error(f"Error viewing deck: {e}")
        return f"Failed to view deck: {str(e)}"


DECK_TOOLS = [
    create_user_deck,
    list_my_decks,
    add_to_deck,
    remove_from_deck,
    view_deck_contents
]


def deck_manager_node(state: Any) -> Dict[str, Any]:
    """
    Agent node that handles deck-related requests.
    """
    # This node is intended to be called when the planner identifies a deck task.
    # It will use the DECK_TOOLS to perform the requested actions.
    llm = make_llm().bind_tools(DECK_TOOLS)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are the Hanachan Deck Manager. You help users create, manage, and view their custom study decks. "
                   "Always be helpful and confirm actions taken."),
        ("placeholder", "{messages}")
    ])
    
    chain = prompt | llm
    response = chain.invoke({"messages": state["messages"]})
    
    return {"messages": [response]}
