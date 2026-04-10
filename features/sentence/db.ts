import { supabase } from "@/lib/supabase";

export const sentenceRepository = {
    getClient(client?: typeof supabase) {
        return client ?? supabase;
    },

    async create(data: {
        japanese_raw: string,
        english_raw: string,
        source?: string,
        japanese_html?: string | null,
        english_html?: string | null,
        audio_url?: string | null,
        created_by?: string
    }, client?: typeof supabase) {
        const db = this.getClient(client);
        const { data: result, error } = await db
            .from('sentences')
            .insert({
                source: 'user',
                ...data,
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating sentence:", error);
            return null;
        }

        return result;
    },

    async getById(id: string) {
        const db = this.getClient();
        // Safety: Prevent 22P02 error by validating UUID format
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (!isUuid) return null;

        const { data, error } = await db
            .from('sentences')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error("Error fetching sentence by ID:", error);
            return null;
        }
        return data;
    },

    async linkKUToSentence(unitId: string, sentenceId: string, isPrimary: boolean = false) {
        const db = this.getClient();
        // Safety: Prevent 22P02 error by validating UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(unitId) || !uuidRegex.test(sentenceId)) {
            console.warn("[SentenceDB] Skipping link due to invalid UUID:", { unitId, sentenceId });
            return;
        }

        const { error } = await db
            .from('sentence_knowledge')
            .upsert({
                ku_id: unitId,
                sentence_id: sentenceId
            });

        if (error) {
            console.error("Error linking KU to sentence:", error);
        }
    },

    async createClozeCard(data: {
        sentence_id: string,
        focus_ku_id: string,
        cloze_data: any,
        note?: string
    }) {
        const db = this.getClient();
        const { data: result, error } = await db
            .from('cloze_sentence_cards')
            .insert(data)
            .select()
            .single();

        if (error) {
            console.error("Error creating cloze card:", error);
            return null;
        }

        // Also create a flashcard entry for it
        await db.from('flashcards').insert({
            cloze_id: result.id,
            card_type: 'cloze'
        });

        return result;
    },

    async getUserSentences(userId: string, client?: typeof supabase) {
        const db = this.getClient(client);
        const { data, error } = await db
            .from('sentences')
            .select('*')
            .eq('created_by', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching user sentences:", error);
            return [];
        }

        return data || [];
    }
}
