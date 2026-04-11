'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { deckService } from './service';

async function getAuthenticatedUserId() {
    const supabase = createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
        throw new Error('Unauthorized');
    }
    return data.user.id;
}

export async function listDecksAction() {
    try {
        const userId = await getAuthenticatedUserId();
        const decks = await deckService.getUserDecks(userId);
        return { success: true, data: decks };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function toggleDeckAction(deckId: string, enabled: boolean) {
    try {
        const result = await deckService.toggleDeck(deckId, enabled);
        revalidatePath('/dashboard');
        revalidatePath('/decks');
        return { success: true, data: result };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function createDeckAction(name: string, description?: string) {
    try {
        const userId = await getAuthenticatedUserId();
        const result = await deckService.createDeck(userId, { name, description });
        revalidatePath('/decks');
        return { success: true, data: result };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function deleteDeckAction(deckId: string) {
    try {
        await deckService.deleteDeck(deckId);
        revalidatePath('/decks');
        return { success: true };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}

export async function fetchDeckDetailsAction(deckId: string) {
    try {
        const deck = await deckService.getDeckDetails(deckId);
        return { success: true, data: deck };
    } catch (e: unknown) {
        return { success: false, error: (e instanceof Error ? e.message : String(e)) };
    }
}
