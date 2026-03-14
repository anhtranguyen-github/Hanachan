import os
from typing import Any

from supabase import Client, create_client


from app.core.config import settings


def get_db_client() -> Client:
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_KEY
    return create_client(url, key)


class DeckService:
    @staticmethod
    async def create_deck(
        user_id: str, name: str, description: str | None = None
    ) -> dict[str, Any]:
        client = get_db_client()
        response = (
            client.table("decks")
            .insert({"user_id": user_id, "name": name, "description": description})
            .execute()
        )
        return response.data[0]

    @staticmethod
    async def list_decks(user_id: str) -> list[dict[str, Any]]:
        client = get_db_client()
        response = client.table("decks").select("*").eq("user_id", user_id).execute()
        return response.data

    @staticmethod
    async def add_deck_item(
        user_id: str, deck_id: str, item_identifier: str, item_type: str = "ku"
    ) -> dict[str, Any]:
        client = get_db_client()
        deck_res = client.table("decks").select("user_id").eq("id", deck_id).execute()
        if not deck_res.data or deck_res.data[0]["user_id"] != user_id:
            raise Exception("Deck not found or access denied")

        response = (
            client.table("deck_items")
            .insert({"deck_id": deck_id, "item_id": item_identifier, "item_type": item_type})
            .execute()
        )
        return response.data[0]

    @staticmethod
    async def remove_deck_item(
        user_id: str, deck_id: str, item_identifier: str, item_type: str = "ku"
    ):
        client = get_db_client()
        deck_res = client.table("decks").select("user_id").eq("id", deck_id).execute()
        if not deck_res.data or deck_res.data[0]["user_id"] != user_id:
            raise Exception("Deck not found or access denied")

        client.table("deck_items").delete().eq("deck_id", deck_id).eq(
            "item_id", item_identifier
        ).eq("item_type", item_type).execute()

    @staticmethod
    async def view_deck_contents(user_id: str, deck_id: str) -> list[dict[str, Any]]:
        client = get_db_client()
        deck_res = client.table("decks").select("user_id").eq("id", deck_id).execute()
        if not deck_res.data or deck_res.data[0]["user_id"] != user_id:
            raise Exception("Deck not found or access denied")

        response = client.table("deck_items").select("*").eq("deck_id", deck_id).execute()
        return response.data
