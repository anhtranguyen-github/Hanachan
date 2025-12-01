import { createClient } from '@/services/supabase/server';
import { Deck, DeckItem, DeckInteraction } from './types';

export async function getUserDecks(userId: string): Promise<Deck[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('decks')
        .select('*')
        .or(`user_id.eq.${userId},user_id.is.null`);

    if (error) {
        console.error('Error fetching decks:', error);
        return [];
    }
    return data as Deck[];
}

export async function createDeck(deck: Partial<Deck>): Promise<Deck | null> {
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
    const supabase = createClient();
    const { error } = await supabase
        .from('deck_items')
        .insert(items);

    if (error) {
        throw new Error(`Failed to add items to deck: ${error.message}`);
    }
}

export async function getDeckItems(deckId: string): Promise<any[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('deck_items')
        .select(`
            *,
            knowledge_units (*)
        `)
        .eq('deck_id', deckId);

    if (error) {
        console.error('Error fetching deck items:', error);
        return [];
    }
    return data;
}

export async function updateInteraction(interaction: DeckInteraction): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
        .from('deck_item_interactions')
        .upsert(interaction);

    if (error) {
        throw new Error(`Failed to update deck interaction: ${error.message}`);
    }
}
