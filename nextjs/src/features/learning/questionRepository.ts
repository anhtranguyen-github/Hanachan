import { supabase } from "@/lib/supabase";

export interface DBQuestion {
    id: string;
    ku_id: string;
    facet: string;
    type: string;
    prompt: string;
    cloze_text_with_blanks?: string;
    correct_answers: string[];
    hints?: string[];
}

export const questionRepository = {
    /**
     * Fetch questions for a list of Knowledge Units and specific facets
     */
    async fetchQuestions(unitId: string, facet: string): Promise<DBQuestion | null> {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .eq('ku_id', unitId)
            .eq('facet', facet)
            .maybeSingle();

        if (error) {
            console.error(`[questionRepository] Error fetching question for ${unitId}-${facet}:`, error);
            return null;
        }

        return data;
    },

    /**
     * Batch fetch questions for multiple KU-Facet pairs
     */
    async fetchQuestionsBatch(items: { unitId: string; facet: string }[]): Promise<DBQuestion[]> {
        // Construct filter for multiple ku_id AND facet pairs is tricky in Postgrest
        // For simplicity and correctness, we'll fetch all questions for these ku_ids 
        // and filter in-memory if the batch is small, or use a RPC if large.
        // Given typically batches are 5-20 items, this is fine.

        const unitIds = Array.from(new Set(items.map(i => i.unitId)));

        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .in('ku_id', unitIds);

        if (error) {
            console.error(`[questionRepository] Error batch fetching questions:`, error);
            return [];
        }

        // Match requested facets
        return items.map(item => {
            return data.find(q => q.ku_id === item.unitId && q.facet === item.facet);
        }).filter(Boolean) as DBQuestion[];
    },

    /**
     * Fetch all questions for a list of KUs (used in Learning/Discovery phase)
     */
    async fetchAllQuestionsForUnits(unitIds: string[]): Promise<DBQuestion[]> {
        const { data, error } = await supabase
            .from('questions')
            .select('*')
            .in('ku_id', unitIds);

        if (error) {
            console.error(`[questionRepository] Error fetching all questions for KUs:`, error);
            return [];
        }

        return data || [];
    }
};
