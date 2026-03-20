"""Deck service backed by Supabase."""

from typing import Any

from supabase import Client


class DeckService:
    def __init__(self, client: Client):
        self.client = client

    async def create_deck(
        self, user_id: str, name: str, description: str | None = None
    ) -> dict[str, Any]:
        response = (
            self.client.table("decks")
            .insert({"user_id": user_id, "name": name, "description": description})
            .execute()
        )
        return response.data[0]

    async def list_decks(self, user_id: str) -> list[dict[str, Any]]:
        response = self.client.table("decks").select("*").eq("user_id", user_id).execute()
        return response.data

    async def add_deck_item(
        self, user_id: str, deck_id: str, item_identifier: str, item_type: str = "ku"
    ) -> dict[str, Any]:
        deck_res = self.client.table("decks").select("user_id").eq("id", deck_id).execute()
        if not deck_res.data or deck_res.data[0]["user_id"] != user_id:
            raise ValueError("Deck not found or access denied")

        response = (
            self.client.table("deck_items")
            .insert({"deck_id": deck_id, "item_id": item_identifier, "item_type": item_type})
            .execute()
        )
        return response.data[0]

    async def remove_deck_item(
        self, user_id: str, deck_id: str, item_identifier: str, item_type: str = "ku"
    ) -> None:
        deck_res = self.client.table("decks").select("user_id").eq("id", deck_id).execute()
        if not deck_res.data or deck_res.data[0]["user_id"] != user_id:
            raise ValueError("Deck not found or access denied")

        self.client.table("deck_items").delete().eq("deck_id", deck_id).eq(
            "item_id", item_identifier
        ).eq("item_type", item_type).execute()

    async def view_deck_contents(self, user_id: str, deck_id: str) -> list[dict[str, Any]]:
        deck_res = self.client.table("decks").select("user_id").eq("id", deck_id).execute()
        if not deck_res.data or deck_res.data[0]["user_id"] != user_id:
            raise ValueError("Deck not found or access denied")

        response = self.client.table("deck_items").select("*").eq("deck_id", deck_id).execute()
        return response.data

    async def delete_deck(self, user_id: str, deck_id: str) -> None:
        deck_res = self.client.table("decks").select("user_id").eq("id", deck_id).execute()
        if not deck_res.data or deck_res.data[0]["user_id"] != user_id:
            raise ValueError("Deck not found or access denied")

        self.client.table("decks").delete().eq("id", deck_id).execute()
