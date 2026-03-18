import asyncio
from app.core.services.deck_service import DeckService

async def main():
    user_id = "a1111111-1111-1111-1111-111111111111"
    
    print("Creating deck...")
    deck = await DeckService.create_deck(user_id, "Test Deck", "A description")
    print(deck)
    deck_id = deck["id"]
    
    print("Listing decks...")
    decks = await DeckService.list_decks(user_id)
    print(f"Found {len(decks)} decks")
    
    print("Deleting deck...")
    await DeckService.delete_deck(user_id, deck_id)
    print("Done")

if __name__ == "__main__":
    asyncio.run(main())
