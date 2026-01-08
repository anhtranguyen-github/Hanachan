import { createClient } from "@/services/supabase/server";
import { KUType } from "./types";

export const kuRepository = {
    async getBySlug(slug: string, type: KUType) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('knowledge_units')
            .select(`
                *,
                ku_kanji (*),
                ku_vocabulary (*),
                ku_radicals (*),
                ku_grammar (*),
                kanji_radicals (
                   radical_id,
                   position,
                   radical:knowledge_units!kanji_radicals_radical_id_fkey (*)
                ),
                grammar_relations:grammar_relations!fk_gr_1 (
                   related:knowledge_units!fk_gr_2 (*)
                ),
                usage:ku_to_sentence (
                   sentence:sentences (*)
                )
            `)
            .eq('slug', slug)
            .eq('type', type)
            .single();

        if (error) {
            console.error(`Error fetching KU by slug ${slug}:`, error);
            return null;
        }
        return data;
    },

    async getAllByType(type: KUType, page: number = 1, limit: number = 30) {
        const supabase = await createClient(); // Awaiting if it's async in latest patterns, though usually it's Sync or returns a promise
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await supabase
            .from('knowledge_units')
            .select(`
                *,
                ku_kanji (reading_data),
                ku_vocabulary (reading_primary)
            `, { count: 'exact' })
            .eq('type', type)
            .order('level', { ascending: true })
            .order('slug', { ascending: true })
            .range(from, to);

        if (error) {
            console.error("Error fetching KUs:", error);
            return { data: [], count: 0 };
        }
        return { data: data || [], count: count || 0 };
    },

    async getByLevel(level: number, type: KUType) {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('knowledge_units')
            .select(`
                *,
                ku_kanji (meaning_data, reading_data),
                ku_vocabulary (reading_primary, meaning_data),
                ku_radicals (name)
            `)
            .eq('type', type)
            .eq('level', level);

        if (error) return [];
        return data;
    },

    async search(query: string, type?: KUType, page: number = 1, limit: number = 30) {
        const supabase = await createClient();
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let q = supabase.from('knowledge_units')
            .select(`
                *,
                ku_kanji (reading_data),
                ku_vocabulary (reading_primary)
            `, { count: 'exact' });

        if (type) q = q.eq('type', type);

        const { data, error, count } = await q
            .or(`character.ilike.%${query}%,meaning.ilike.%${query}%,search_key.ilike.%${query}%`)
            .order('level', { ascending: true })
            .range(from, to);

        if (error) return { data: [], count: 0 };
        return { data: data || [], count: count || 0 };
    }
};
