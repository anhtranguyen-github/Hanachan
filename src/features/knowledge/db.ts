
import { KnowledgeUnit, KUType } from "./types";
import { createClient } from "@/services/supabase/server";
import { getDetailsTableName, mapToKU } from "./mapper";

export class SupabaseKURepository {

    async getById(id: string, type: KUType): Promise<KnowledgeUnit | null> {
        const supabase = createClient();

        const { data: kuData, error: kuError } = await supabase
            .from('knowledge_units')
            .select('*')
            .eq('slug', id)
            .single();

        if (kuError || !kuData) return null;

        const detailsTable = getDetailsTableName(type);
        const { data: detailsData, error: detailsError } = await supabase
            .from(detailsTable)
            .select('*')
            .eq('ku_id', kuData.slug)
            .single();

        if (detailsError && detailsError.code !== 'PGRST116') {
            console.error(`Error fetching details for KU ${id}:`, detailsError);
        }

        return mapToKU(kuData, detailsData || {}, type);
    }

    async getBySlug(slug: string, type: KUType): Promise<KnowledgeUnit | null> {
        const supabase = createClient();

        const { data: kuData, error: kuError } = await supabase
            .from('knowledge_units')
            .select('*')
            .eq('slug', slug)
            .eq('type', type)
            .single();

        if (kuError || !kuData) return null;

        const detailsTable = getDetailsTableName(type);
        const { data: detailsData, error: detailsError } = await supabase
            .from(detailsTable)
            .select('*')
            .eq('ku_id', kuData.slug)
            .single();

        if (detailsError && detailsError.code !== 'PGRST116') {
            console.error(`Error fetching details for KU slug ${slug}:`, detailsError);
        }

        return mapToKU(kuData, detailsData || {}, type);
    }

    async getByLevel(level: number, type: KUType): Promise<KnowledgeUnit[]> {
        const supabase = createClient();
        const detailsTable = getDetailsTableName(type);
        const query = `*, ${detailsTable} (*)`;

        const { data, error } = await supabase
            .from('knowledge_units')
            .select(query)
            .eq('type', type)
            .eq('level', level);

        if (error) {
            console.error(`Error fetching KUs for level ${level}:`, error);
            return [];
        }

        return (data || []).map((row: any) => {
            const details = row[detailsTable] ? (Array.isArray(row[detailsTable]) ? row[detailsTable][0] : row[detailsTable]) : {};
            return mapToKU(row, details, type);
        });
    }

    async getAllByType(type: KUType): Promise<KnowledgeUnit[]> {
        const supabase = createClient();
        const detailsTable = getDetailsTableName(type);
        const query = `*, ${detailsTable} (*)`;

        const { data, error } = await supabase
            .from('knowledge_units')
            .select(query)
            .eq('type', type)
            .order('level', { ascending: true });

        if (error) {
            console.error(`Error fetching all KUs for type ${type}:`, error);
            return [];
        }

        return (data || []).map((row: any) => {
            const details = row[detailsTable] ? (Array.isArray(row[detailsTable]) ? row[detailsTable][0] : row[detailsTable]) : {};
            return mapToKU(row, details, type);
        });
    }

    async getSentencesByKU(kuId: string): Promise<any[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('ku_to_sentence')
            .select(`is_primary, cloze_positions, sentences (*)`)
            .eq('ku_id', kuId);

        if (error) {
            console.error(`Error fetching sentences for KU ${kuId}:`, error);
            return [];
        }

        return (data || []).map((row: any) => ({
            ...row.sentences,
            is_primary: row.is_primary,
            cloze_positions: row.cloze_positions
        }));
    }

    async search(query: string, type?: KUType): Promise<KnowledgeUnit[]> {
        const supabase = createClient();
        let queryBuilder = supabase.from('knowledge_units').select('*');

        if (type) queryBuilder = queryBuilder.eq('type', type);
        queryBuilder = queryBuilder.or(`character.ilike.%${query}%,meaning.ilike.%${query}%`);

        const { data, error } = await queryBuilder.limit(50);
        if (error) return [];

        return await Promise.all(data.map(async (row: any) => {
            const detailsTable = getDetailsTableName(row.type);
            const { data: details } = await supabase.from(detailsTable).select('*').eq('ku_id', row.slug).single();
            return mapToKU(row, details || {}, row.type as KUType);
        }));
    }
}

export const kuRepository = new SupabaseKURepository();
