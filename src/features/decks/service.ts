/**
 * Decks Service Layer
 * 
 * Business logic for deck operations.
 * All users use fixed 60 system decks (Level 1-60).
 * Custom deck creation has been removed.
 */

import * as db from './db';
import { Deck, DeckItem, DeckStats } from './types';

const LOG_PREFIX = '[DecksService]';

export class DeckService {
    /**
     * Get all system decks (60 fixed decks for all users)
     */
    async getUserDecks(userId: string): Promise<Deck[]> {
        console.log(`${LOG_PREFIX} getUserDecks:`, userId);
        return await db.getUserDecks(userId);
    }

    /**
     * Get a single deck by ID
     */
    async getDeckById(deckId: string): Promise<Deck | null> {
        return await db.getDeckById(deckId);
    }

    /**
     * Retrieves all items in a deck with KU details
     */
    async getDeckContent(deckId: string): Promise<DeckItem[]> {
        console.log(`${LOG_PREFIX} getDeckContent:`, deckId);
        return await db.getDeckItems(deckId);
    }

    /**
     * Calculates mastery stats for a specific deck
     */
    async getDeckMastery(userId: string, deckId: string): Promise<DeckStats> {
        console.log(`${LOG_PREFIX} getDeckMastery:`, { userId, deckId });
        return await db.getDeckMasteryStats(userId, deckId);
    }

    /**
     * Get decks with their stats pre-calculated
     */
    async getUserDecksWithStats(userId: string): Promise<Deck[]> {
        console.log(`${LOG_PREFIX} getUserDecksWithStats:`, userId);

        const decks = await this.getUserDecks(userId);

        // Calculate stats for each deck
        const decksWithStats = await Promise.all(
            decks.map(async (deck) => {
                try {
                    const stats = await this.getDeckMastery(userId, deck.id);
                    return { ...deck, stats };
                } catch (error) {
                    console.warn(`${LOG_PREFIX} Failed to get stats for deck:`, deck.id);
                    return {
                        ...deck,
                        stats: { total: 0, due: 0, new: 0, learned: 0, coverage: 0 }
                    };
                }
            })
        );

        return decksWithStats;
    }

    /**
     * Get items due for review from a specific deck
     */
    async getDueItems(userId: string, deckId: string, limit: number = 20): Promise<any[]> {
        console.log(`${LOG_PREFIX} getDueItems:`, { userId, deckId, limit });

        const items = await db.getDeckItems(deckId);
        const kuIds = items.map(i => i.ku_id).filter(Boolean) as string[];

        if (kuIds.length === 0) return [];

        // This is a simplified version - in production you'd want a more optimized query
        const { data: dueStates } = await import('@/lib/supabase').then(m =>
            m.supabase
                .from('user_learning_states')
                .select('*, knowledge_units(*)')
                .eq('user_id', userId)
                .in('ku_id', kuIds)
                .lte('next_review', new Date().toISOString())
                .limit(limit)
        );

        return dueStates || [];
    }
}

export const deckService = new DeckService();
