'use server';

import { backendClient } from '@/services/backendClient';
import { revalidatePath } from 'next/cache';

export async function listDecksAction() {
    try {
        const decks = await backendClient.listDecks();
        return { success: true, data: decks };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function toggleDeckAction(deckId: string, enabled: boolean) {
    try {
        const result = await backendClient.toggleDeck(deckId, enabled);
        revalidatePath('/dashboard');
        revalidatePath('/decks');
        return { success: true, data: result };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function createDeckAction(name: string, description?: string) {
    try {
        const result = await backendClient.createDeck(name, description);
        revalidatePath('/decks');
        return { success: true, data: result };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function deleteDeckAction(deckId: string) {
    try {
        await backendClient.deleteDeck(deckId);
        revalidatePath('/decks');
        return { success: true };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function fetchDeckDetailsAction(deckId: string) {
    try {
        const deck = await backendClient.getDeck(deckId);
        return { success: true, data: deck };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}
