import { supabase } from "@/lib/supabase";
import { KnowledgeUnitType, KnowledgeUnit } from "./types";
import { getDetailsTableName, mapToKnowledgeUnit } from "./mapper";

export const curriculumRepository = {
    async getById(id: string, type: KnowledgeUnitType) {
        // Safety: Prevent 22P02 error by validation UUID format
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (!isUuid) return null;

        const tableName = getDetailsTableName(type);
        const { data, error } = await supabase
            .from('knowledge_units')
            .select(`*, details:${tableName}(*), user_fsrs_states(*)`)
            .eq('id', id)
            .maybeSingle();

        if (error || !data) return null;
        // Fix for potentially returning array from Supabase join
        const anyData = data as any;
        const details = Array.isArray(anyData.details) ? anyData.details[0] : anyData.details;
        return mapToKnowledgeUnit(anyData, details, type);
    },

    async getBySlug(slug: string, type: KnowledgeUnitType): Promise<KnowledgeUnit | null> {
        try {
            const tableName = getDetailsTableName(type);
            const cleanSlug = decodeURIComponent(slug).trim();

            let { data, error } = await supabase
                .from('knowledge_units')
                .select(`*, details:${tableName}(*), user_fsrs_states(*)`)
                .eq('slug', cleanSlug)
                .maybeSingle();

            if (!data && !cleanSlug.includes(':')) {
                const prefixedSlug = `${type}:${cleanSlug}`;
                const { data: prefixedData } = await supabase
                    .from('knowledge_units')
                    .select(`*, details:${tableName}(*), user_fsrs_states(*)`)
                    .eq('slug', prefixedSlug)
                    .maybeSingle();
                data = prefixedData;
            }

            if (!data) return null;

            const anyData = data as any;
            const details = Array.isArray(anyData.details) ? anyData.details[0] : anyData.details;
            const mapped = mapToKnowledgeUnit(anyData, details, type);

            // Fetch Relations based on type
            if (type === 'kanji') {
                if (anyData.metadata?.component_subject_ids?.length) {
                    const { data: radicals } = await supabase
                        .from('knowledge_units')
                        .select('*, details:radical_details(*)')
                        .in('metadata->wk_id', anyData.metadata.component_subject_ids);
                    mapped.radicals = radicals?.map(r => mapToKnowledgeUnit(r, Array.isArray(r.details) ? r.details[0] : r.details, 'radical')) || [];
                } else {
                    mapped.radicals = [];
                }

                if (anyData.metadata?.amalgamation_subject_ids?.length) {
                    const { data: vocab } = await supabase
                        .from('knowledge_units')
                        .select('*, details:vocabulary_details(*)')
                        .in('metadata->wk_id', anyData.metadata.amalgamation_subject_ids)
                        .limit(20);
                    mapped.vocabulary = vocab?.map(v => mapToKnowledgeUnit(v, Array.isArray(v.details) ? v.details[0] : v.details, 'vocabulary')) || [];
                } else {
                    mapped.vocabulary = [];
                }

                if (anyData.metadata?.visually_similar_subject_ids?.length) {
                    const { data: similar } = await supabase
                        .from('knowledge_units')
                        .select('*, details:kanji_details(*)')
                        .in('metadata->wk_id', anyData.metadata.visually_similar_subject_ids);
                    mapped.visually_similar = similar?.map(k => mapToKnowledgeUnit(k, Array.isArray(k.details) ? k.details[0] : k.details, 'kanji')) || [];
                } else {
                    mapped.visually_similar = [];
                }

            } else if (type === 'vocabulary') {
                if (anyData.metadata?.component_subject_ids?.length) {
                    const { data: kanji } = await supabase
                        .from('knowledge_units')
                        .select('*, details:kanji_details(*)')
                        .in('metadata->wk_id', anyData.metadata.component_subject_ids);
                    mapped.kanji = kanji?.map(k => mapToKnowledgeUnit(k, Array.isArray(k.details) ? k.details[0] : k.details, 'kanji')) || [];
                } else {
                    mapped.kanji = [];
                }
                
            } else if (type === 'radical') {
                if (anyData.metadata?.amalgamation_subject_ids?.length) {
                    const { data: kanji } = await supabase
                        .from('knowledge_units')
                        .select('*, details:kanji_details(*)')
                        .in('metadata->wk_id', anyData.metadata.amalgamation_subject_ids)
                        .limit(20);
                    mapped.kanji = kanji?.map(k => mapToKnowledgeUnit(k, Array.isArray(k.details) ? k.details[0] : k.details, 'kanji')) || [];
                } else {
                    mapped.kanji = [];
                }

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

    async getAllByType(type: KnowledgeUnitType, page: number = 1, limit: number = 30) {
        const tableName = getDetailsTableName(type);
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error, count } = await supabase
            .from('knowledge_units')
            .select(`*, details:${tableName}(*), user_fsrs_states(*)`, { count: 'exact' })
            .eq('type', type)
            .range(from, to)
            .order('level', { ascending: true })
            .order('slug', { ascending: true });

        if (error) {
            console.error("Error fetching all units by type:", error);
            return { data: [], count: 0 };
        }

        const mapped = (data as any[]).map(item => {
            const details = Array.isArray(item.details) ? item.details[0] : item.details;
            return mapToKnowledgeUnit(item, details, type);
        });

        return { data: mapped, count: count || 0 };
    },

    async listByType(type: KnowledgeUnitType, level: number) {
        const tableName = getDetailsTableName(type);
        const { data, error } = await supabase
            .from('knowledge_units')
            .select(`*, details:${tableName}(*), user_fsrs_states(*)`)
            .eq('level', level)
            .eq('type', type);

        if (error) {
            console.error(`Error fetching units by level ${level}:`, error);
            return [];
        }

        return (data as any[]).map(item => {
            const details = Array.isArray(item.details) ? item.details[0] : item.details;
            return mapToKnowledgeUnit(item, details, type);
        });
    },

    async search(query: string, type?: KnowledgeUnitType, page: number = 1, limit: number = 30) {
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

    async getSentencesByUnit(unitId: string) {
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

    async createKnowledgeUnit(unit: { slug: string, type: KnowledgeUnitType, character: string, meaning: string, level: number, details?: any }) {
        const { data, error } = await supabase
            .from('knowledge_units')
            .insert({
                slug: unit.slug,
                type: unit.type,
                character: unit.character,
                meaning: unit.meaning,
                level: unit.level
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating unit:", error);
            throw error;
        }

        if (unit.details) {
            const tableName = getDetailsTableName(unit.type);
            await supabase
                .from(tableName)
                .insert({
                    ku_id: data.id,
                    ...unit.details
                });
        }

        return data;
    }
};

export const kuRepository = curriculumRepository;

