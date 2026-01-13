'use server';

import { createClient } from "@/services/supabase/server";
import { revalidatePath } from "next/cache";
import { MockDB } from "@/lib/mock-db";

// --- Server Actions ---

export async function getLocalRelations(type: string, identity: string) {
    // Mock implementation for relations
    // valid types: kanji, vocabulary, grammar, radical
    const slug = `${type}/${decodeURIComponent(identity)}`;
    // TODO: Add relation support to MockDB if needed, for now return empty compliant structure
    return {
        related_vocab: [],
        components: [],
        examples: [],
        related_grammar: [],
        related_kanji: [],
        found_in_kanji: []
    };
}


export async function getLocalLevelData(level: number, type: string) {
    try {
        const items = await MockDB.fetchLevelContent(level, "mock-user"); // user-id irrelevant for content only
        const filtered = items.filter((k: any) => k.type === (type === 'vocab' ? 'vocabulary' : type));

        return filtered.map((item: any) => {
            // Map structure to what frontend expects for explorer lists
            let reading = '';
            if (item.type === 'kanji') reading = item.ku_kanji?.reading_data?.on?.[0] || '';
            else if (item.type === 'vocabulary') reading = item.ku_vocabulary?.reading_primary || '';

            return {
                ...item,
                reading: reading
            };
        });
    } catch (e) {
        console.error("Error in getLocalLevelData (MockDB):", e);
        return [];
    }
}

export async function getLocalKU(type: string, id: string) {
    try {
        const item: any = await MockDB.fetchItemDetails(type, id);
        if (!item) return null;

        // Flatten/Normalize for frontend
        let meanings: string[] = [];
        let readings: string[] = [];

        if (type === 'kanji' && item.ku_kanji) {
            meanings = item.ku_kanji.meaning_data?.meanings || [item.meaning];
            readings = [...(item.ku_kanji.reading_data?.on || []), ...(item.ku_kanji.reading_data?.kun || [])];
        } else if (type === 'vocabulary' && item.ku_vocabulary) {
            meanings = item.ku_vocabulary.meaning_data?.meanings || [item.meaning];
            readings = [item.ku_vocabulary.reading_primary];
        } else if (type === 'radical' && item.ku_radicals) {
            meanings = [item.ku_radicals.name];
        } else if (type === 'grammar' && item.ku_grammar) {
            meanings = [item.ku_grammar.meaning_summary || item.meaning];
        } else {
            meanings = [item.meaning];
        }

        return {
            ...item,
            meanings,
            readings,
            metadata: {}
        };

    } catch (e) {
        console.error("Error in getLocalKU (MockDB):", e);
        return null;
    }
}

export async function seedDatabaseAction() {
    // No-op for MockDB essentially, or we could reset it.
    // Frontend calls this to "seed" real DB usually.
    return { success: true };
}
