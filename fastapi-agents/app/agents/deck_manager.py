"""
Deck Manager Agent - handles user requests for creating and managing custom decks.
Pure Agent Runtime version - calls fastapi-core for persistence via MCP.
"""

from __future__ import annotations

import logging
from typing import Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from pydantic import BaseModel, Field

from app.core.config import settings
from app.mcp.client import McpClient

logger = logging.getLogger(__name__)


class CreateDeckSchema(BaseModel):
    name: str = Field(description="The name of the new deck.")
    description: str | None = Field(default=None, description="Optional description of the deck.")


@tool(args_schema=CreateDeckSchema)
async def create_user_deck(name: str, description: str | None = None, **kwargs) -> str:
    """
    Create a new custom deck for the user.
    """
    user_id = kwargs.get("user_id", "INJECTED")
    jwt = kwargs.get("jwt", "SYSTEM_PROVIDED")
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        result = await client.call_tool(
            "create_deck", {"name": name, "description": description}, jwt=jwt
        )
        if isinstance(result, str) and "Error" in result:
            return result

        # For simplicity, if result is a string representing a dict, just return it directly
        return f"Successfully created deck '{name}'\nResult: {result}"
    except Exception as e:
        logger.error(f"Error creating deck: {e}")
        return f"Failed to create deck: {str(e)}"


class ListDecksSchema(BaseModel):
    pass


@tool(args_schema=ListDecksSchema)
async def list_my_decks(**kwargs) -> str:
    """
    List all custom decks created by the user.
    """
    user_id = kwargs.get("user_id", "INJECTED")
    jwt = kwargs.get("jwt", "SYSTEM_PROVIDED")
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        decks_str = await client.call_tool("list_decks", {}, jwt=jwt)

        if not decks_str or decks_str == "[]" or decks_str == "None":
            return "You don't have any custom decks yet. Would you like to create one?"

        return f"Your custom decks:\n{decks_str}"
    except Exception as e:
        logger.error(f"Error listing decks: {e}")
        return f"Failed to list decks: {str(e)}"


class AddToDeckSchema(BaseModel):
    deck_name_or_id: str = Field(description="Name or ID of the deck.")
    item_identifier: str = Field(description="The item (Kanji/Slug/Word) to add.")
    item_type: str = Field(description="Type of item ('kanji', 'vocabulary', etc.)")


@tool(args_schema=AddToDeckSchema)
async def add_to_deck(deck_name_or_id: str, item_identifier: str, item_type: str, **kwargs) -> str:
    """
    Add an item to a specific deck.
    """
    user_id = kwargs.get("user_id", "INJECTED")
    jwt = kwargs.get("jwt", "SYSTEM_PROVIDED")
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        try:
            UUID(deck_name_or_id)
            deck_id = deck_name_or_id
        except ValueError:
            decks_str = await client.call_tool("list_decks", {}, jwt=jwt)
            # Simplistic fallback check, letting core handle exact name lookups if implemented or expecting ID.
            import ast

            try:
                decks = ast.literal_eval(decks_str) if decks_str else []
                deck = next((d for d in decks if d.get("name") == deck_name_or_id), None)
                if not deck:
                    return f"Could not find a deck named '{deck_name_or_id}'. Please list your decks first."
                deck_id = deck["id"]
            except Exception:
                return f"Could not parse decks or find deck named '{deck_name_or_id}'."

        await client.call_tool(
            "add_to_deck",
            {
                "deck_id": str(deck_id),
                "item_identifier": item_identifier,
                "item_type": item_type,
            },
            jwt=jwt,
        )
        return f"Successfully added {item_type} '{item_identifier}' to deck."
    except Exception as e:
        logger.error(f"Error adding to deck: {e}")
        return f"Failed to add item to deck: {str(e)}"


class RemoveFromDeckSchema(BaseModel):
    deck_name_or_id: str = Field(description="Name or ID of the deck.")
    item_identifier: str = Field(description="The item (Kanji/Slug/Word) to remove.")
    item_type: str = Field(description="Type of item.")


@tool(args_schema=RemoveFromDeckSchema)
async def remove_from_deck(deck_name_or_id: str, item_identifier: str, item_type: str, **kwargs) -> str:
    """
    Remove an item from a specific deck.
    """
    user_id = kwargs.get("user_id", "INJECTED")
    jwt = kwargs.get("jwt", "SYSTEM_PROVIDED")
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        try:
            UUID(deck_name_or_id)
            deck_id = deck_name_or_id
        except ValueError:
            decks_str = await client.call_tool("list_decks", {}, jwt=jwt)
            import ast

            try:
                decks = ast.literal_eval(decks_str) if decks_str else []
                deck = next((d for d in decks if d.get("name") == deck_name_or_id), None)
                if not deck:
                    return f"Could not find a deck named '{deck_name_or_id}'."
                deck_id = deck["id"]
            except Exception:
                return f"Could not parse decks or find deck named '{deck_name_or_id}'."

        await client.call_tool(
            "remove_from_deck",
            {
                "deck_id": str(deck_id),
                "item_identifier": item_identifier,
                "item_type": item_type,
            },
            jwt=jwt,
        )
        return f"Successfully removed {item_type} '{item_identifier}' from deck."
    except Exception as e:
        logger.error(f"Error removing from deck: {e}")
        return f"Failed to remove item from deck: {str(e)}"


class ViewDeckSchema(BaseModel):
    deck_name_or_id: str = Field(description="Name or ID of the deck to view.")


@tool(args_schema=ViewDeckSchema)
async def view_deck_contents(deck_name_or_id: str, **kwargs) -> str:
    """
    Show all items currently in a deck.
    """
    user_id = kwargs.get("user_id", "INJECTED")
    jwt = kwargs.get("jwt", "SYSTEM_PROVIDED")
    try:
        client = McpClient(settings.fastapi_core_mcp_url)
        try:
            UUID(deck_name_or_id)
            deck_id = deck_name_or_id
        except ValueError:
            decks_str = await client.call_tool("list_decks", {}, jwt=jwt)
            import ast

            try:
                decks = ast.literal_eval(decks_str) if decks_str else []
                deck = next((d for d in decks if d.get("name") == deck_name_or_id), None)
                if not deck:
                    return f"Could not find a deck named '{deck_name_or_id}'."
                deck_id = deck["id"]
            except Exception:
                return f"Could not parse decks or find deck named '{deck_name_or_id}'."

        result = await client.call_tool(
            "view_deck_contents", {"deck_id": str(deck_id)}, jwt=jwt
        )
        return f"Contents of deck {deck_id}: {result}"
    except Exception as e:
        logger.error(f"Error viewing deck: {e}")
        return f"Failed to view deck: {str(e)}"


DECK_TOOLS = [create_user_deck, list_my_decks, add_to_deck, remove_from_deck, view_deck_contents]


def deck_manager_node(state: Any) -> dict[str, Any]:
    """
    Agent node that handles deck-related requests.
    """
    llm = make_llm().bind_tools(DECK_TOOLS)

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are the Hanachan Deck Manager. You help users create, manage, and view their custom study decks. "
                "Always be helpful and confirm actions taken.",
            ),
            ("placeholder", "{messages}"),
        ]
    )

    chain = prompt | llm
    response = chain.invoke({"messages": state["messages"]})

    return {"messages": [response]}
