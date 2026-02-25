'use server';

/**
 * Deck Server Actions
 * 
 * Server-side actions for deck operations, exposed to client components.
 * All users use fixed 60 system decks (Level 1-60).
 * Custom deck creation has been removed.
 */

import { deckService } from './service';
import { Deck, DeckStats } from './types';

const LOG_PREFIX = '[DecksActions]';

export interface ActionResult<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Get all system decks with their stats
 */
export async function getUserDecksAction(userId: string): Promise<ActionResult<Deck[]>> {
    console.log(`${LOG_PREFIX} getUserDecksAction for userId:`, userId);

    try {
        const decks = await deckService.getUserDecks(userId);
        console.log(`${LOG_PREFIX} Found ${decks?.length || 0} decks`);

        // Enrich with stats
        const enriched = await Promise.all(
            (decks || []).map(async (deck) => {
                try {
                    const stats = await deckService.getDeckMastery(userId, deck.id);
                    return { ...deck, stats: stats || { due: 0, new: 0, total: 0, learned: 0 } };
                } catch (statsError) {
                    console.warn(`${LOG_PREFIX} Failed to get stats for deck:`, deck.id, statsError);
                    return { ...deck, stats: { due: 0, new: 0, total: 0, learned: 0 } };
                }
            })
        );

        console.log(`${LOG_PREFIX} Returning ${enriched.length} enriched decks`);
        return { success: true, data: enriched };
    } catch (e: any) {
        console.error(`${LOG_PREFIX} Error:`, e.message);
        return { success: false, error: e.message, data: [] };
    }
}

/**
 * Get content of a specific deck
 */
export async function getDeckContentAction(deckId: string): Promise<ActionResult<any[]>> {
    console.log(`${LOG_PREFIX} getDeckContentAction:`, deckId);

    try {
        const content = await deckService.getDeckContent(deckId);
        console.log(`${LOG_PREFIX} Found ${content?.length || 0} items`);
        return { success: true, data: content };
    } catch (e: any) {
        console.error(`${LOG_PREFIX} Error:`, e.message);
        return { success: false, error: e.message, data: [] };
    }
}

/**
 * Get deck mastery stats
 */
export async function getDeckMasteryAction(
    userId: string,
    deckId: string
): Promise<ActionResult<DeckStats>> {
    console.log(`${LOG_PREFIX} getDeckMasteryAction:`, { userId, deckId });

    try {
        const stats = await deckService.getDeckMastery(userId, deckId);
        return { success: true, data: stats };
    } catch (e: any) {
        console.error(`${LOG_PREFIX} Error:`, e.message);
        return {
            success: false,
            error: e.message,
            data: { total: 0, due: 0, new: 0, learned: 0, coverage: 0 }
        };
    }
}
