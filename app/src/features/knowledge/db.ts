import { supabase } from "@/lib/supabase";
import { KUType, KnowledgeUnit } from "./types";
import { getDetailsTableName, mapToKU } from "./mapper";

export const kuRepository = {
    async getById(id: string, type: KUType) {
        // Safety: Prevent 22P02 error by validation UUID format
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (!isUuid) return null;

        const tableName = getDetailsTableName(type);
        const { data, error } = await supabase
            .from('knowledge_units')
            .select(`*, details:${tableName}(*), user_learning_states(*)`)
            .eq('id', id)
            .maybeSingle();

        if (error || !data) return null;
        // Fix for potentially returning array from Supabase join
        const anyData = data as any;
        const details = Array.isArray(anyData.details) ? anyData.details[0] : anyData.details;
        return mapToKU(anyData, details, type);
    },

    async getBySlug(slug: string, type: KUType): Promise<KnowledgeUnit | null> {
        try {
            const tableName = getDetailsTableName(type);
            const cleanSlug = decodeURIComponent(slug).trim();

            let { data, error } = await supabase
                .from('knowledge_units')
                .select(`*, details:${tableName}(*), user_learning_states(*)`)
                .eq('slug', cleanSlug)
                .maybeSingle();

            if (!data && !cleanSlug.includes(':')) {
                const prefixedSlug = `${type}:${cleanSlug}`;
                const { data: prefixedData } = await supabase
                    .from('knowledge_units')
                    .select(`*, details:${tableName}(*), user_learning_states(*)`)
                    .eq('slug', prefixedSlug)
                    .maybeSingle();
                data = prefixedData;
            }

            if (!data) return null;

            const anyData = data as any;
            const details = Array.isArray(anyData.details) ? anyData.details[0] : anyData.details;
            const mapped = mapToKU(anyData, details, type);

            // Fetch Relations based on type
            if (type === 'kanji') {
                const { data: radicals } = await supabase
                    .from('kanji_radicals')
                    .select('radical:knowledge_units!kanji_radicals_radical_id_fkey(*, details:radical_details(*))')
                    .eq('kanji_id', anyData.id);
                mapped.radicals = radicals?.map(r => (r as any).radical) || [];

                const { data: vocab } = await supabase
                    .from('vocabulary_kanji')
                    .select('vocab:knowledge_units!vocabulary_kanji_vocab_id_fkey(*, details:vocabulary_details(*))')
                    .eq('kanji_id', anyData.id)
                    .limit(10);
                mapped.vocabulary = vocab?.map(v => (v as any).vocab) || [];
            } else if (type === 'vocabulary') {
                const { data: kanji } = await supabase
                    .from('vocabulary_kanji')
                    .select('kanji:knowledge_units!vocabulary_kanji_kanji_id_fkey(*, details:kanji_details(*))')
                    .eq('vocab_id', anyData.id);
                mapped.kanji = kanji?.map(k => (k as any).kanji) || [];
            } else if (type === 'radical') {
                const { data: kanji } = await supabase
                    .from('kanji_radicals')
                    .select('kanji:knowledge_units!kanji_radicals_kanji_id_fkey(*, details:kanji_details(*))')
                    .eq('radical_id', anyData.id)
                    .limit(20);
                mapped.kanji = kanji?.map(k => (k as any).kanji) || [];
            } else if (type === 'grammar') {
                const { data: relations } = await supabase
                    .from('grammar_relations')
                    .select('related:knowledge_units!grammar_relations_related_id_fkey(*), type, comparison_note')
                    .eq('grammar_id', anyData.id);
                mapped.related_grammar = relations || [];
            }

            return mapped;
        } catch (e) {
            console.error(`Error in getBySlug (${type}, ${slug}):`, e);
            return null;
        }
    },

    async getAllByType(type: KUType, page: number = 1, limit: number = 30) {
        const tableName = getDetailsTableName(type);
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await supabase
            .from('knowledge_units')
            .select(`*, details:${tableName}(*), user_learning_states(*)`, { count: 'exact' })
            .eq('type', type)
            .range(from, to)
            .order('level', { ascending: true })
            .order('slug', { ascending: true });

        if (error) {
            console.error("Error fetching all KUs by type:", error);
            return { data: [], count: 0 };
        }

        const mapped = (data as any[]).map(item => {
            const details = Array.isArray(item.details) ? item.details[0] : item.details;
            return mapToKU(item, details, type);
        });

        return { data: mapped, count: count || 0 };
    },

    async listByType(type: KUType, level: number) {
        const tableName = getDetailsTableName(type);
        const { data, error } = await supabase
            .from('knowledge_units')
            .select(`*, details:${tableName}(*), user_learning_states(*)`)
            .eq('level', level)
            .eq('type', type);

        if (error) {
            console.error(`Error fetching KUs by level ${level}:`, error);
            return [];
        }

        return (data as any[]).map(item => {
            const details = Array.isArray(item.details) ? item.details[0] : item.details;
            return mapToKU(item, details, type);
        });
    },

    async search(query: string, type?: KUType, page: number = 1, limit: number = 30) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let supabaseQuery = supabase
            .from('knowledge_units')
            .select(`*`, { count: 'exact' });

        if (type) {
            supabaseQuery = supabaseQuery.eq('type', type);
        }

        if (query) {
            supabaseQuery = supabaseQuery.or(`slug.ilike.%${query}%,character.ilike.%${query}%,meaning.ilike.%${query}%`);
        }

        const { data, error, count } = await supabaseQuery
            .range(from, to)
            .order('level', { ascending: true });

        if (error) {
            console.error("Error searching KUs:", error);
            return { data: [], count: 0 };
        }

        return { data: data as any, count: count || 0 };
    },

    async getSentencesByKU(kuId: string) {
        // In the new schema, grammar example sentences are in grammar_details
        // Vocabulary example sentences are not in a separate table yet, but we can extend this later.
        // For now, let's just return empty as most data is JSONB in details
        return [];
    },

    async getGrammarRelations(grammarId: string) {
        const { data, error } = await supabase
            .from('grammar_relations')
            .select('related:knowledge_units!grammar_relations_related_id_fkey(*), type, comparison_note')
            .eq('grammar_id', grammarId);

        if (error) {
            console.error("Error fetching grammar relations:", error);
            return [];
        }

        return data;
    },

    async createKU(ku: { slug: string, type: KUType, character: string, meaning: string, level: number, details?: any }) {
        const { data, error } = await supabase
            .from('knowledge_units')
            .insert({
                slug: ku.slug,
                type: ku.type,
                character: ku.character,
                meaning: ku.meaning,
                level: ku.level
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating KU:", error);
            throw error;
        }

        if (ku.details) {
            const tableName = getDetailsTableName(ku.type);
            await supabase
                .from(tableName)
                .insert({
                    ku_id: data.id,
                    ...ku.details
                });
        }

        return data;
    }
};

