
import * as db from './db';
import { Deck, DeckItem } from './types';

export class DeckService {
    /**
     * Creates a new personal deck for a user.
     */
    async createDeck(userId: string, name: string, description?: string): Promise<Deck | null> {
        return await db.createDeck({
            user_id: userId,
            name,
            description,
            type: 'user_mined'
        });
    }

    /**
     * Adds a Knowledge Unit to a deck.
     * Prevents duplicates and maintains referential integrity.
     */
    async addKUToDeck(
        userId: string,
        deckId: string,
        kuId: string,
        sentenceId?: string
    ): Promise<void> {
        // Validation: In a full app, check if deck belongs to user
        const items: DeckItem[] = [{
            deck_id: deckId,
            ku_id: kuId,
            sentence_id: sentenceId
        }];

        await db.addItemsToDeck(items);
    }

    /**
     * Retrieves all items in a deck with KU details.
     */
    async getDeckContent(deckId: string) {
        return await db.getDeckItems(deckId);
    }

    /**
     * Calculates mastery stats for a specific deck.
     */
    async getDeckMastery(userId: string, deckId: string) {
        return await db.getDeckMasteryStats(userId, deckId);
    }
}

export const deckService = new DeckService();
