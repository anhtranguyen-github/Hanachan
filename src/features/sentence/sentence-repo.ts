import { createAdminClient } from '@/services/supabase/server';
import { SentenceEntity } from './types';

export class SentenceRepository {

    /**
     * Finds a sentence by text and source (Dedup logic)
     */
    async findExisting(text: string, sourceId?: string): Promise<SentenceEntity | null> {
        const supabase = createAdminClient();
        // Since sentences doesn't have source_id column, we search primarily by text
        // and filter by metadata if needed, but for now text_ja is the unique key per user check
        const { data } = await supabase
            .from('sentences')
            .select('*')
            .eq('text_ja', text)
            .maybeSingle();
        return data as SentenceEntity;
    }

    async addSentence(data: {
        text: string;
        translation?: string;
        sourceType: 'youtube' | 'chat' | 'manual';
        sourceId?: string;
        timestamp?: number;
        userId?: string;
    }): Promise<SentenceEntity> {
        const supabase = createAdminClient();

        const existing = await this.findExisting(data.text, data.sourceId);
        if (existing) {
            return existing;
        }

        if (!data.userId) {
            throw new Error("Unauthorized: userId is required to add a sentence");
        }

        const payload = {
            text_ja: data.text,
            text_en: data.translation,
            source_type: data.sourceType,
            source_metadata: {
                source_id: data.sourceId,
                timestamp: data.timestamp
            },
            user_id: data.userId
        };

        const { data: inserted, error } = await supabase
            .from('sentences')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error("❌ Error adding sentence:", JSON.stringify(error, null, 2));
            throw error;
        }

        console.log(`✅ Saved Sentence to DB: "${data.text.substring(0, 15)}..." (ID: ${inserted.id})`);
        return inserted as SentenceEntity;
    }

    async getById(id: string): Promise<SentenceEntity | null> {
        const supabase = createAdminClient();
        const { data } = await supabase.from('sentences').select('*').eq('id', id).single();
        return data as SentenceEntity;
    }
}

export const sentenceRepo = new SentenceRepository();
