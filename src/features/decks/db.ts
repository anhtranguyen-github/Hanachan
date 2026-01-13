import { createClient } from '@/services/supabase/server';
import { Deck, DeckItem, DeckInteraction } from './types';
import { MockDB } from '@/lib/mock-db';

// Toggle to force mock data usage for frontend development
const FORCE_MOCK = true;

export async function getUserDecks(userId: string): Promise<Deck[]> {
    if (FORCE_MOCK) {
        return MockDB.getUserDecks(userId) as unknown as Deck[];
    }

    const supabase = createClient();
    const { data, error } = await supabase
        .from('decks')
        .select('*')
        .or(`user_id.eq.${userId},user_id.is.null`);

    if (error || !data || data.length === 0) {
        console.warn('Fetching decks failed or empty, using mocks');
        return MockDB.getUserDecks(userId) as unknown as Deck[];
    }
    return data as Deck[];
}

export async function createDeck(deck: Partial<Deck>): Promise<Deck | null> {
    if (FORCE_MOCK) {
        return MockDB.createDeck(deck) as unknown as Deck;
    }

    const supabase = createClient();
    const { data, error } = await supabase
        .from('decks')
        .insert(deck)
        .select()
        .single();

    if (error) {
        console.error('Error creating deck:', error);
        return null;
    }
    return data as Deck;
}

export async function addItemsToDeck(items: DeckItem[]): Promise<void> {
    if (FORCE_MOCK) {
        // Mock implementation for adding items (no-op or simple log for now as MockDB seeds are static-ish)
        console.log('[MockDB] Adding items to deck:', items);
        return;
    }

    const supabase = createClient();
    const { error } = await supabase
        .from('deck_items')
        .insert(items);

    if (error) {
        throw new Error(`Failed to add items to deck: ${error.message}`);
    }
}

export async function getDeckItems(deckId: string): Promise<any[]> {
    if (FORCE_MOCK) {
        return MockDB.getDeckItems(deckId);
    }

    const supabase = createClient();
    const { data, error } = await supabase
        .from('deck_items')
        .select(`
            *,
            knowledge_units (*)
        `)
        .eq('deck_id', deckId);

    if (error || !data || data.length === 0) {
        console.warn('Error fetching deck items or empty, using mocks');
        return MockDB.getDeckItems(deckId);
    }
    return data;
}

export async function updateInteraction(interaction: DeckInteraction): Promise<void> {
    if (FORCE_MOCK) {
        console.log('[MockDB] Updating interaction:', interaction);
        return;
    }

    const supabase = createClient();
    const { error } = await supabase
        .from('deck_item_interactions')
        .upsert(interaction);

    if (error) {
        throw new Error(`Failed to update deck interaction: ${error.message}`);
    }
}

export async function getDeckMasteryStats(userId: string, deckId: string) {
    if (FORCE_MOCK) {
        return MockDB.getDeckMasteryStats(userId, deckId);
    }

    const supabase = createClient();

    // Joint query to get learning states for items in this specific deck
    const { data, error } = await supabase
        .from('deck_items')
        .select(`
            ku_id,
            user_learning_states!inner (
                state
            )
        `)
        .eq('deck_id', deckId)
        .eq('user_learning_states.user_id', userId);

    if (error) {
        console.error('Error fetching deck mastery:', error);
        // Fallback to mock if DB fails
        return MockDB.getDeckMasteryStats(userId, deckId);
    }

    const total = data.length;
    const learned = data.filter((item: any) => item.user_learning_states[0]?.state !== 'new').length;
    const burned = data.filter((item: any) => item.user_learning_states[0]?.state === 'burned').length;

    return { total, learned, burned };
}

