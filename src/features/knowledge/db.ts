
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

    async getBySlug(slug: string, type: KUType): Promise<KnowledgeUnit | null> {
        const supabase = createClient();

        // 1. Get base KU
        const { data: kuData, error: kuError } = await supabase
            .from('knowledge_units')
            .select('*')
            .eq('slug', slug)
            .eq('type', type)
            .single();

        if (kuError || !kuData) return null;

        // 2. Get specific details
        const detailsTable = this.getDetailsTableName(type);
        const { data: detailsData, error: detailsError } = await supabase
            .from(detailsTable)
            .select('*')
            .eq('ku_id', kuData.id)
            .single();

        if (detailsError && detailsError.code !== 'PGRST116') {
            console.error(`Error fetching details for KU slug ${slug}:`, detailsError);
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

    async getAllByType(type: KUType): Promise<KnowledgeUnit[]> {
        const supabase = createClient();
        const detailsTable = this.getDetailsTableName(type);
        const query = `
            *,
            ${detailsTable} (*)
        `;

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
            return this.mapToKU(row, details, type);
        });
    }

    async getSentencesByKU(kuId: string): Promise<any[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('ku_to_sentence')
            .select(`
                is_primary,
                cloze_positions,
                sentences (*)
            `)
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

    async getLinkedKanjiByRadical(radicalSlug: string): Promise<any[]> {
        const supabase = createClient();
        // Since we don't have a direct link table, we use metadata or name search
        // In the seeded data, some kanji might have radical slugs in metadata
        const { data, error } = await supabase
            .from('ku_kanji')
            .select('*, knowledge_units(*)')
            .contains('metadata', { radical_slugs: [radicalSlug] });

        if (error) {
            // Fallback: search for kanji containing the radical's character if it exists
            return [];
        }

        return (data || []).map((row: any) => this.mapToKU(row.knowledge_units, row, 'kanji'));
    }

    async getLinkedVocabByKanji(kanjiChar: string): Promise<any[]> {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('ku_vocabulary')
            .select('*, knowledge_units(*)')
            .ilike('character', `%${kanjiChar}%`)
            .limit(20);

        if (error) {
            console.error(`Error fetching vocab for kanji ${kanjiChar}:`, error);
            return [];
        }

        return (data || []).map((row: any) => this.mapToKU(row.knowledge_units, row, 'vocabulary'));
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
            slug: base.slug,
            type: base.type,
            character: type === 'grammar' ? (details.title || base.slug) : (type === 'radical' ? (details.character || base.slug) : (details.character || base.slug)),
            level: base.level,
            meaning: meaning,
            details: details
        };
    }
}

export const kuRepository = new SupabaseKURepository();
