"""
Deck Manager Agent - handles user requests for creating and managing custom decks.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional
from uuid import UUID

from langchain_core.tools import tool
from langchain_core.messages import AIMessage
from langchain_core.prompts import ChatPromptTemplate

from ..services.deck_service import get_deck_service
from ..services import learning_service as learn_serv
from ..services.sentence_library import get_sentence_library_service
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
        service = get_deck_service()
        deck = service.create_deck(user_id, name, description)
        return f"Successfully created deck '{deck['name']}' (ID: {deck['id']})."
    except Exception as e:
        return f"Failed to create deck: {str(e)}"


@tool
def list_my_decks(user_id: str = "INJECTED") -> str:
    """
    List all custom decks created by the user.
    """
    try:
        service = get_deck_service()
        decks = service.get_user_decks(user_id)
        if not decks:
            return "You don't have any custom decks yet. Would you like to create one?"
        
        lines = ["Your custom decks:"]
        for d in decks:
            desc = f" - {d['description']}" if d['description'] else ""
            lines.append(f"• {d['name']} (ID: {d['id']}){desc}")
        return "\n".join(lines)
    except Exception as e:
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
        service = get_deck_service()
        
        # 1. Resolve deck
        deck_id = None
        decks = service.get_user_decks(user_id)
        for d in decks:
            if str(d["id"]) == deck_name_or_id or d["name"].lower() == deck_name_or_id.lower():
                deck_id = str(d["id"])
                break
        
        if not deck_id:
            return f"Could not find a deck named '{deck_name_or_id}'."

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
        service.add_item_to_deck(user_id, deck_id, real_item_id, item_type)
        return f"Successfully added {item_type} '{item_identifier}' to deck."
    except Exception as e:
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
        service = get_deck_service()
        
        # 1. Resolve deck
        deck_id = None
        decks = service.get_user_decks(user_id)
        for d in decks:
            if str(d["id"]) == deck_name_or_id or d["name"].lower() == deck_name_or_id.lower():
                deck_id = str(d["id"])
                break
        
        if not deck_id:
            return f"Could not find a deck named '{deck_name_or_id}'."

        # 2. Resolve item_id if needed
        real_item_id = item_identifier
        if item_type == "ku":
            ku = learn_serv.get_ku_by_character(item_identifier)
            if not ku:
                ku = learn_serv.get_ku_by_slug(item_identifier)
            if not ku:
                return f"Could not find knowledge unit for '{item_identifier}'."
            real_item_id = str(ku["id"])
        
        # 3. Remove
        success = service.remove_item_from_deck(user_id, deck_id, real_item_id, item_type)
        if success:
            return f"Successfully removed {item_type} '{item_identifier}' from deck."
        return "Failed to remove item (maybe it wasn't in the deck?)"
    except Exception as e:
        return f"Failed to remove item from deck: {str(e)}"


@tool
def view_deck_contents(deck_name_or_id: str, user_id: str = "INJECTED") -> str:
    """
    Show all items currently in a deck.
    """
    try:
        service = get_deck_service()
        
        # Resolve deck
        deck_id = None
        decks = service.get_user_decks(user_id)
        for d in decks:
            if str(d["id"]) == deck_name_or_id or d["name"].lower() == deck_name_or_id.lower():
                deck_id = str(d["id"])
                break
        
        if not deck_id:
            return f"Could not find a deck named '{deck_name_or_id}'."

        details = service.get_deck_details(deck_id, user_id)
        items = details.get("items", [])
        
        if not items:
            return f"The deck '{details['name']}' is empty."
            
        lines = [f"Contents of '{details['name']}':"]
        for item in items:
            # Enhanced labels for KUs if possible
            label = item["item_id"]
            if item["item_type"] == "ku":
                # We could fetch KU details here for better display
                query = "SELECT character, meaning FROM public.knowledge_units WHERE id = %s"
                ku = learn_serv.execute_single(query, (str(item["item_id"]),))
                if ku:
                    label = f"{ku['character']} ({ku['meaning']})"
            
            lines.append(f"• [{item['item_type'].upper()}] {label}")
            
        return "\n".join(lines)
    except Exception as e:
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
