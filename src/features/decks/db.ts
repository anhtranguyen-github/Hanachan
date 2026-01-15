import { MockDB } from '@/lib/mock-db';
import { Deck, DeckItem, DeckInteraction } from './types';

export async function getUserDecks(userId: string): Promise<Deck[]> {
    return MockDB.getUserDecks(userId) as unknown as Deck[];
}

export async function createDeck(deck: Partial<Deck>): Promise<Deck | null> {
    return MockDB.createDeck(deck) as unknown as Deck;
}

export async function addItemsToDeck(items: DeckItem[]): Promise<void> {
    console.log('[MockDB] Adding items to deck:', items);
}

export async function getDeckItems(deckId: string): Promise<any[]> {
    return MockDB.getDeckItems(deckId);
}

export async function updateInteraction(interaction: DeckInteraction): Promise<void> {
    console.log('[MockDB] Updating interaction:', interaction);
}

export async function getDeckMasteryStats(userId: string, deckId: string) {
    return MockDB.getDeckMasteryStats(userId, deckId);
}


