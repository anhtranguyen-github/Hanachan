
import { KnowledgeUnit, KUType } from "./types";
import { createClient } from "@/services/supabase/server";

export class SupabaseKURepository {

    async getById(id: string, type: KUType): Promise<KnowledgeUnit | null> {
        const supabase = createClient();

        // 1. Get base KU
        const { data: kuData, error: kuError } = await supabase
            .from('knowledge_units')
            .select('*')
            .eq('id', id)
            .single();

        if (kuError || !kuData) return null;

        // 2. Get specific details
        const detailsTable = this.getDetailsTableName(type);
        const { data: detailsData, error: detailsError } = await supabase
            .from(detailsTable)
            .select('*')
            .eq('ku_id', id)
            .single();

        if (detailsError && detailsError.code !== 'PGRST116') { // Ignore not found if data might be missing, but usually it shouldn't
            console.error(`Error fetching details for KU ${id}:`, detailsError);
        }

        return this.mapToKU(kuData, detailsData || {}, type);
    }

    async getByLevel(level: number, type: KUType): Promise<KnowledgeUnit[]> {
        const supabase = createClient();

        // Join with details table
        // Supabase Syntax: knowledge_units!inner(...)
        // But since we are partitioning by type, we can query knowledge_units and join the specific table
        const detailsTable = this.getDetailsTableName(type);

        // Construct the select query to include the relation
        // e.g., *, ku_kanji(*)
        const query = `
            *,
            ${detailsTable} (*)
        `;

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
            return this.mapToKU(row, details, type);
        });
    }

    async search(query: string, type?: KUType): Promise<KnowledgeUnit[]> {
        const supabase = createClient();
        let queryBuilder = supabase.from('knowledge_units').select('*');

        if (type) {
            queryBuilder = queryBuilder.eq('type', type);
        }

        // Using Trigram search on search_key or simple ilike on slug/character
        // The schema has `search_key` and `search_reading`.
        // Let's assume search_key is populated with something searchable.
        // Fallback to slug search for now if search_key is empty
        queryBuilder = queryBuilder.or(`slug.ilike.%${query}%,search_key.ilike.%${query}%`);

        const { data, error } = await queryBuilder.limit(50);

        if (error) {
            console.error("Search error:", error);
            return [];
        }

        const results = await Promise.all(data.map(async (row: any) => {
            const detailsTable = this.getDetailsTableName(row.type);
            const { data: details } = await supabase.from(detailsTable).select('*').eq('ku_id', row.id).single();
            return this.mapToKU(row, details || {}, row.type);
        }));

        return results;
    }

    // --- Helpers ---

    private getDetailsTableName(type: KUType): string {
        switch (type) {
            case 'radical': return 'ku_radicals';
            case 'kanji': return 'ku_kanji';
            case 'vocabulary': return 'ku_vocabulary';
            case 'grammar': return 'ku_grammar';
            default: throw new Error(`Unknown KU type: ${type}`);
        }
    }

    private mapToKU(base: any, details: any, type: KUType): KnowledgeUnit {
        let meaning = "";

        if (type === 'radical') {
            meaning = details.name || "";
        } else if (type === 'grammar') {
            meaning = details.title || ""; // Grammar usually uses title as primary identifier/meaning
        } else {
            // Kanji / Vocab
            // meaning_data is JSONB
            const mData = details.meaning_data;
            if (mData) {
                if (Array.isArray(mData.primary)) meaning = mData.primary[0];
                else if (typeof mData.primary === 'string') meaning = mData.primary;
                else if (Array.isArray(mData)) meaning = mData[0];
            }
        }

        // If meaning is still empty, look at base slug
        if (!meaning) meaning = base.slug;

        return {
            id: base.id,
            type: base.type,
            character: type === 'grammar' ? (details.title || base.slug) : (type === 'radical' ? (details.character || base.slug) : (details.character || base.slug)),
            level: base.level,
            meaning: meaning,
            details: details
        };
    }
}

export const kuRepository = new SupabaseKURepository();
