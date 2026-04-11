import { createClient } from '@/utils/supabase/server';
import { Deck, DeckItem } from './types';

function normalizeDeck(deck: Record<string, any>, enabled = true): Deck {
    return {
        id: String(deck.id),
        user_id: deck.user_id,
        name: deck.name,
        description: deck.description ?? null,
        created_at: deck.created_at,
        updated_at: deck.data_updated_at ?? deck.updated_at,
        deck_items: deck.deck_items,
        is_enabled: enabled,
        is_system: false,
    } as Deck;
}

export const deckService = {
    async createDeck(userId: string, deck: { name: string; description?: string }): Promise<Deck | null> {
        const supabase = createClient();
        const payload = {
            user_id: userId,
            name: deck.name,
            description: deck.description ?? null,
            current_level: 1,
            config: {},
        };

        const { data, error } = await supabase
            .from('custom_decks')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error("Error creating deck:", error);
            return null;
        }

        const pref = await supabase
            .from('user_deck_preferences')
            .upsert({ user_id: userId, deck_id: data.id, is_enabled: true }, { onConflict: 'user_id,deck_id' });
        if (pref.error) {
            console.warn('Deck created but preference row was not persisted:', pref.error);
        }

        return normalizeDeck(data, true);
    },

    async getUserDecks(userId: string): Promise<Deck[]> {
        const supabase = createClient();
        const { data: decks, error } = await supabase
            .from('custom_decks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching decks:", error);
            return [];
        }

        const prefs = await supabase
            .from('user_deck_preferences')
            .select('deck_id,is_enabled')
            .eq('user_id', userId);

        const enabledByDeckId = new Map<number, boolean>();
        if (!prefs.error) {
            (prefs.data || []).forEach((row) => enabledByDeckId.set(Number(row.deck_id), Boolean(row.is_enabled)));
        }

        return (decks || []).map((deck) => normalizeDeck(deck, enabledByDeckId.get(Number(deck.id)) ?? true));
    },

    async getDeckDetails(deckId: string): Promise<Deck | null> {
        const supabase = createClient();
        const numericDeckId = Number.parseInt(deckId, 10);
        const { data: deck, error } = await supabase
            .from('custom_decks')
            .select('*')
            .eq('id', numericDeckId)
            .single();

        if (error) {
            console.error("Error fetching deck details:", error);
            return null;
        }

        const items = await supabase
            .from('custom_deck_items')
            .select('*')
            .eq('deck_id', numericDeckId)
            .order('custom_level', { ascending: true });

        const normalizedItems: DeckItem[] = (items.data || []).map((item) => ({
            id: String(item.id),
            deck_id: String(item.deck_id),
            item_id: String(item.subject_id),
            item_type: 'ku',
            created_at: item.created_at,
        }));

        return normalizeDeck({ ...deck, deck_items: normalizedItems });
    },

    async toggleDeck(deckId: string, enabled: boolean): Promise<Deck | null> {
        const supabase = createClient();
        const numericDeckId = Number.parseInt(deckId, 10);
        const session = await supabase.auth.getUser();
        const userId = session.data.user?.id;
        if (!userId) {
            console.error('Error toggling deck: Unauthorized');
            return null;
        }

        const { error } = await supabase
            .from('user_deck_preferences')
            .upsert({ user_id: userId, deck_id: numericDeckId, is_enabled: enabled }, { onConflict: 'user_id,deck_id' });

        if (error) {
            console.error('Error toggling deck:', error);
            return null;
        }

        const { data: deck, error: deckError } = await supabase
            .from('custom_decks')
            .select('*')
            .eq('id', numericDeckId)
            .select()
            .single();

        if (deckError) {
            console.error('Error loading deck after toggle:', deckError);
            return null;
        }

        return normalizeDeck(deck, enabled);
    },

    async addItemToDeck(deckId: string, itemId: string, itemType: string): Promise<DeckItem | null> {
        const supabase = createClient();
        const numericDeckId = Number.parseInt(deckId, 10);
        const subjectId = Number.parseInt(itemId, 10);
        const { data, error } = await supabase
            .from('custom_deck_items')
            .insert({
                deck_id: numericDeckId,
                subject_id: subjectId,
                custom_level: 1,
            })
            .select()
            .single();

        if (error) {
            console.error("Error adding item to deck:", error);
            return null;
        }
        return {
            id: String(data.id),
            deck_id: String(data.deck_id),
            item_id: String(data.subject_id),
            item_type: 'ku',
            created_at: data.created_at,
        };
    },

    async removeItemFromDeck(deckId: string, itemId: string, itemType: string): Promise<boolean> {
        const supabase = createClient();
        const numericDeckId = Number.parseInt(deckId, 10);
        const subjectId = Number.parseInt(itemId, 10);
        const { error } = await supabase
            .from('custom_deck_items')
            .delete()
            .match({ deck_id: numericDeckId, subject_id: subjectId });

        if (error) {
            console.error("Error removing item from deck:", error);
            return false;
        }
        return true;
    },

    async deleteDeck(deckId: string): Promise<boolean> {
        const supabase = createClient();
        const numericDeckId = Number.parseInt(deckId, 10);
        const { error } = await supabase.from('custom_decks').delete().eq('id', numericDeckId);

        if (error) {
            console.error("Error deleting deck:", error);
            return false;
        }

        const prefDelete = await supabase.from('user_deck_preferences').delete().eq('deck_id', numericDeckId);
        if (prefDelete.error) {
            console.warn('Deleted deck but failed to clean preferences:', prefDelete.error);
        }
        return true;
    }
};
