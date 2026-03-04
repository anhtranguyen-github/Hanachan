import { supabase, supabaseService } from "@/lib/supabase";

const db = supabaseService || supabase;
import { Deck, DeckCreate, DeckItem } from "./types";

export const deckService = {
    async createDeck(deck: { name: string; description?: string }): Promise<Deck | null> {
        const { data, error } = await supabase
            .from("decks")
            .insert(deck)
            .select()
            .single();

        if (error) {
            console.error("Error creating deck:", error);
            return null;
        }
        return data;
    },

    async getUserDecks(): Promise<Deck[]> {
        const { data, error } = await supabase
            .from("decks")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching decks:", error);
            return [];
        }
        return data || [];
    },

    async getDeckDetails(deckId: string): Promise<Deck | null> {
        const { data, error } = await supabase
            .from("decks")
            .select("*, deck_items(*)")
            .eq("id", deckId)
            .single();

        if (error) {
            console.error("Error fetching deck details:", error);
            return null;
        }
        return data;
    },

    async addItemToDeck(deckId: string, itemId: string, itemType: string): Promise<DeckItem | null> {
        const { data, error } = await supabase
            .from("deck_items")
            .insert({
                deck_id: deckId,
                item_id: itemId,
                item_type: itemType,
            })
            .select()
            .single();

        if (error) {
            console.error("Error adding item to deck:", error);
            return null;
        }
        return data;
    },

    async removeItemFromDeck(deckId: string, itemId: string, itemType: string): Promise<boolean> {
        const { error } = await supabase
            .from("deck_items")
            .delete()
            .match({ deck_id: deckId, item_id: itemId, item_type: itemType });

        if (error) {
            console.error("Error removing item from deck:", error);
            return false;
        }
        return true;
    },

    async deleteDeck(deckId: string): Promise<boolean> {
        const { error } = await supabase
            .from("decks")
            .delete()
            .eq("id", deckId);

        if (error) {
            console.error("Error deleting deck:", error);
            return false;
        }
        return true;
    }
};
