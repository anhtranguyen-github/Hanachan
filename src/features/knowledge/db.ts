import { createClient } from "@/services/supabase/server";
import { KUType } from "./types";

export const kuRepository = {
    async getBySlug(slug: string, type: KUType) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('knowledge_units')
            .select(`
                *,
                ku_kanji (*),
                ku_vocabulary (*),
                ku_radicals (*),
                ku_grammar (*)
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

    async getAllByType(type: KUType) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('knowledge_units')
            .select('*')
            .eq('type', type)
            .order('level', { ascending: true });

        if (error) return [];
        return data;
    },

    async getByLevel(level: number, type: KUType) {
        const supabase = createClient();
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

    async search(query: string, type?: KUType) {
        const supabase = createClient();
        let q = supabase.from('knowledge_units').select('*');

        if (type) q = q.eq('type', type);

        const { data, error } = await q.or(`character.ilike.%${query}%,meaning.ilike.%${query}%,search_key.ilike.%${query}%`).limit(20);

        if (error) return [];
        return data;
    }
};
