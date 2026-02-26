import { supabase } from "@/lib/supabase";

export const sentenceRepository = {
    async create(data: {
        text_ja: string,
        text_en?: string,
        origin: string,
        source_text?: string,
        metadata?: any,
        created_by?: string
    }) {
        const { data: result, error } = await supabase
            .from('sentences')
            .insert(data)
            .select()
            .single();

        if (error) {
            console.error("Error creating sentence:", error);
            return null;
        }

        return result;
    },

    async getById(id: string) {
        // Safety: Prevent 22P02 error by validating UUID format
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        if (!isUuid) return null;

        const { data, error } = await supabase
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
        // Safety: Prevent 22P02 error by validating UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(unitId) || !uuidRegex.test(sentenceId)) {
            console.warn("[SentenceDB] Skipping link due to invalid UUID:", { unitId, sentenceId });
            return;
        }

        const { error } = await supabase
            .from('ku_to_sentence')
            .upsert({
                ku_id: unitId,
                sentence_id: sentenceId,
                is_primary: isPrimary
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
        const { data: result, error } = await supabase
            .from('cloze_sentence_cards')
            .insert(data)
            .select()
            .single();

        if (error) {
            console.error("Error creating cloze card:", error);
            return null;
        }

        // Also create a flashcard entry for it
        await supabase.from('flashcards').insert({
            cloze_id: result.id,
            card_type: 'cloze'
        });

        return result;
    },

    async getUserSentences(userId: string) {
        const { data, error } = await supabase
            .from('sentences')
            .select('*')
            .eq('created_by', userId)
            .order('created_at', { ascending: false });

        return data || [];
    }
}
