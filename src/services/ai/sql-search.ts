
import { createClient } from '../supabase/server';
import { KnowledgeUnit } from '../../features/knowledge/types';
import { RetrievalResult } from '../../features/chat/retrieval-logic';

/**
 * Standard SQL-based Search Adapter using Supabase (PostgreSQL).
 * Replaces Vector Search with deterministic Text Search.
 */
export class SqlSearchService {
    /**
     * Performs a text-based search for Knowledge Units.
     * Uses simple ILIKE pattern matching on Character and Meaning.
     */
    async search(query: string, limit: number = 5): Promise<RetrievalResult[]> {
        const supabase = createClient();

        // Simple logic: Match partial character OR partial meaning
        // In production, you might want to consider Postgres FTS (tsvector) for better performance
        const { data, error } = await supabase
            .from('knowledge_units')
            .select('*')
            .or(`character.ilike.%${query}%,meaning.ilike.%${query}%`)
            .limit(limit);

        if (error) {
            console.error('SQL search error:', error);
            return [];
        }

        return (data as any[]).map(item => ({
            ku: {
                id: item.slug,
                character: item.character,
                meaning: item.meaning,
                type: item.type,
                level: item.level,
                slug: item.slug,
                details: {}
            } as KnowledgeUnit,
            // Assign a high "similarity" score if exact match, otherwise lower
            score: item.character === query ? 1.0 : 0.8
        }));
    }
}

export const sqlSearch = new SqlSearchService();
