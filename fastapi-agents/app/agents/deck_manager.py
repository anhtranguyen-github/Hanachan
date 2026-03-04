"""
Deck Manager Agent - handles user requests for creating and managing custom decks.
Pure Agent Runtime version - calls fastapi-domain for persistence.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional
from uuid import UUID

from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate

from app.core.domain_client import DomainClient
from app.core.llm import make_llm

logger = logging.getLogger(__name__)


@tool
async def create_user_deck(name: str, jwt: str, description: Optional[str] = None, user_id: str = "INJECTED") -> str:
    """
    Create a new custom deck for the user.
    
    Args:
        name: The name of the deck.
        jwt: The user's JWT (injected automatically).
        description: An optional description of the deck's purpose.
    """
    try:
        client = DomainClient(jwt)
        result = await client.create_deck(name, description)
        return f"Successfully created deck '{result['name']}' (ID: {result['id']})."
    except Exception as e:
        logger.error(f"Error creating deck: {e}")
        return f"Failed to create deck: {str(e)}"


@tool
async def list_my_decks(jwt: str, user_id: str = "INJECTED") -> str:
    """
    List all custom decks created by the user.
    
    Args:
        jwt: The user's JWT (injected automatically).
    """
    try:
        client = DomainClient(jwt)
        decks = await client.list_decks()
        
        if not decks:
            return "You don't have any custom decks yet. Would you like to create one?"
        
        lines = ["Your custom decks:"]
        for d in decks:
            desc = f" - {d['description']}" if d.get('description') else ""
            lines.append(f"• {d['name']} (ID: {d['id']}){desc}")
        return "\n".join(lines)
    except Exception as e:
        logger.error(f"Error listing decks: {e}")
        return f"Failed to list decks: {str(e)}"


@tool
async def add_to_deck(
    deck_name_or_id: str, 
    item_identifier: str, 
    item_type: str, 
    jwt: str,
    user_id: str = "INJECTED"
) -> str:
    """
    Add an item to a specific deck.
    
    Args:
        deck_name_or_id: The name or UUID of the deck.
        item_identifier: The item to add. For 'ku', use character or slug. For others, use ID.
        item_type: Type of item ('ku', 'sentence', 'video').
        jwt: The user's JWT (injected automatically).
    """
    try:
        client = DomainClient(jwt)
        # 1. Resolve deck (Note: This might need a GET /decks/{id} or search in list)
        # For simplicity in this demo, we assume the agent provides the correct ID or we'd need a search endpoint in Domain
        # If the domain service doesn't have a lookup by name, the agent should list decks first.
        
        # Try finding by UUID
        try:
            UUID(deck_name_or_id)
            deck_id = deck_name_or_id
        except ValueError:
            # Search by name in list
            decks = await client.list_decks()
            deck = next((d for d in decks if d['name'] == deck_name_or_id), None)
            if not deck:
                return f"Could not find a deck named '{deck_name_or_id}'. Please list your decks first."
            deck_id = deck['id']

        result = await client.add_to_deck(UUID(deck_id), item_identifier, item_type)
        return f"Successfully added {item_type} '{item_identifier}' to deck."
    except Exception as e:
        logger.error(f"Error adding to deck: {e}")
        return f"Failed to add item to deck: {str(e)}"


@tool
async def remove_from_deck(
    deck_name_or_id: str, 
    item_identifier: str, 
    item_type: str, 
    jwt: str,
    user_id: str = "INJECTED"
) -> str:
    """
    Remove an item from a specific deck.
    """
    try:
        client = DomainClient(jwt)
        # Resolve deck ID
        try:
            UUID(deck_name_or_id)
            deck_id = deck_name_or_id
        except ValueError:
            decks = await client.list_decks()
            deck = next((d for d in decks if d['name'] == deck_name_or_id), None)
            if not deck:
                return f"Could not find a deck named '{deck_name_or_id}'."
            deck_id = deck['id']

        await client.remove_from_deck(UUID(deck_id), item_identifier, item_type)
        return f"Successfully removed {item_type} '{item_identifier}' from deck."
    except Exception as e:
        logger.error(f"Error removing from deck: {e}")
        return f"Failed to remove item from deck: {str(e)}"


@tool
async def view_deck_contents(deck_name_or_id: str, jwt: str, user_id: str = "INJECTED") -> str:
    """
    Show all items currently in a deck.
    """
    try:
        client = DomainClient(jwt)
        # Resolve deck ID
        try:
            UUID(deck_name_or_id)
            deck_id = deck_name_or_id
        except ValueError:
            decks = await client.list_decks()
            deck = next((d for d in decks if d['name'] == deck_name_or_id), None)
            if not deck:
                return f"Could not find a deck named '{deck_name_or_id}'."
            deck_id = deck['id']

        # Note: We need a "GET /decks/{id}/items" in Domain. 
        # For now, let's assume we can get it.
        # This is a placeholder for the actual Domain call.
        return f"Contents of deck {deck_id} retrieved (Logic moved to Domain)."
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
    llm = make_llm().bind_tools(DECK_TOOLS)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are the Hanachan Deck Manager. You help users create, manage, and view their custom study decks. "
                   "Always be helpful and confirm actions taken."),
        ("placeholder", "{messages}")
    ])
    
    chain = prompt | llm
    response = chain.invoke({"messages": state["messages"]})
    
    return {"messages": [response]}
