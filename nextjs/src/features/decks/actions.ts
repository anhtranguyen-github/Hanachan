'use server';

import { coreClient } from '@/services/coreClient';
import { revalidatePath } from 'next/cache';

export async function listDecksAction() {
    try {
        const decks = await coreClient.listDecks();
        return { success: true, data: decks };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function toggleDeckAction(deckId: string, enabled: boolean) {
    try {
        const result = await coreClient.toggleDeck(deckId, enabled);
        revalidatePath('/dashboard');
        revalidatePath('/decks');
        return { success: true, data: result };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function createDeckAction(name: string, description?: string) {
    try {
        const result = await coreClient.createDeck(name, description);
        revalidatePath('/decks');
        return { success: true, data: result };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function deleteDeckAction(deckId: string) {
    try {
        await coreClient.deleteDeck(deckId);
        revalidatePath('/decks');
        return { success: true };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function fetchDeckDetailsAction(deckId: string) {
    try {
        const deck = await coreClient.getDeck(deckId);
        return { success: true, data: deck };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}
