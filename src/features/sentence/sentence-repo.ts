import { createClient } from '@/services/supabase/server';
import { SentenceEntity } from './types';

export class SentenceRepository {

    /**
     * Finds a sentence by text and source (Dedup logic)
     */
    async findExisting(text: string, sourceId?: string): Promise<SentenceEntity | null> {
        const supabase = createClient();
        const { data } = await supabase
            .from('sentences')
            .select('*')
            .eq('text_ja', text)
            .eq('source_id', sourceId || '') // Handle null
            .single();
        return data as SentenceEntity;
    }

    async addSentence(data: {
        text: string;
        translation?: string;
        sourceType: 'youtube' | 'chat' | 'manual';
        sourceId?: string;
        timestamp?: number;
        userId?: string; // Optional if we infer from auth context, but for scripts we pass it
    }): Promise<SentenceEntity> {
        const supabase = createClient();

        // 1. Check duplicate
        const existing = await this.findExisting(data.text, data.sourceId);
        if (existing) {
            console.log(`♻️ Sentence already exists: ${existing.id}`);
            return existing;
        }

        // 2. Insert
        // Note: For scripts, we might need to be careful with 'user_id' if RLS is on.
        // The createClient implementation uses Service Key in scripts, verifying RLS bypass.
        // But we should provide a userId if the table requires it and we are admin.
        // Assuming we default to a specific User ID for testing or it's inferred.

        // Hardcoding a Dev User ID if not provided, for CLI testing purposes
        const TEST_USER_ID = "00000000-0000-0000-0000-000000000000";

        const payload = {
            text_ja: data.text,
            text_en: data.translation,
            source_type: data.sourceType,
            source_id: data.sourceId,
            timestamp: data.timestamp,
            user_id: data.userId || TEST_USER_ID // Fallback for script
        };

        const { data: inserted, error } = await supabase
            .from('sentences')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error("❌ Error adding sentence:", error);
            throw error;
        }

        console.log(`✅ Saved Sentence to DB: "${data.text.substring(0, 15)}..." (ID: ${inserted.id})`);
        return inserted as SentenceEntity;
    }

    async getById(id: string): Promise<SentenceEntity | null> {
        const supabase = createClient();
        const { data } = await supabase.from('sentences').select('*').eq('id', id).single();
        return data as SentenceEntity;
    }
}

export const sentenceRepo = new SentenceRepository();
