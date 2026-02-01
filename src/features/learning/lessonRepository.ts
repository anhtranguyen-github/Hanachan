import { supabase } from "@/lib/supabase";

export const lessonRepository = {
    async fetchNewItems(userId: string, limit: number = 5, level?: number) {
        // Get IDs of items user is already learning
        const { data: learned, error: learnedError } = await supabase
            .from('user_learning_states')
            .select('ku_id')
            .eq('user_id', userId);

        const learnedIds = learned?.map(l => l.ku_id) || [];
        console.log(`[lessonRepository] fetchNewItems: User ${userId} Level ${level}. Learned Count: ${learnedIds.length}`);

        let query = supabase
            .from('knowledge_units')
            .select('*, kanji_details(*), vocabulary_details(*), grammar_details(*)');

        if (learnedIds.length > 0) {
            // Manual format (id1,id2) for Postgrest
            query = query.filter('id', 'not.in', `(${learnedIds.join(',')})`);
        }

        if (level) {
            query = query.eq('level', level);
        }

        const { data, error } = await query
            .limit(limit)
            .order('level', { ascending: true })
            .order('slug', { ascending: true });

        if (error) {
            console.error("[lessonRepository] Error fetching new items:", error);
            return [];
        }

        console.log(`[lessonRepository] fetchNewItems: Found ${data?.length} items.`);

        return data.map(ku => ({
            user_id: userId,
            ku_id: ku.id,
            state: 'new',
            knowledge_units: ku,
            srs_stage: 0,
            next_review: null
        }));
    },

    async fetchLevelContent(level: number, userId: string) {
        const { data, error } = await supabase
            .from('knowledge_units')
            .select('*, user_learning_states(*)')
            .eq('level', level);

        if (error) {
            console.error("[lessonRepository] Error fetching level content:", error);
            return [];
        }

        // Filter user_learning_states for the current user manually to avoid parent filtering
        return data.map(item => ({
            ...item,
            user_learning_states: item.user_learning_states?.filter((s: any) => s.user_id === userId) || []
        }));
    },

    async countTodayBatches(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error } = await supabase
            .from('lesson_batches')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', today.toISOString());

        if (error) {
            console.error("[lessonRepository] Error counting today's batches:", error);
            return 0;
        }
        return count || 0;
    },

    async createLessonBatch(userId: string, level: number) {
        const { data, error } = await supabase
            .from('lesson_batches')
            .insert({
                user_id: userId,
                level: level,
                status: 'in_progress'
            })
            .select()
            .single();

        if (error) {
            console.error("[lessonRepository] Error creating lesson batch:", error);
            throw error;
        }
        return data;
    },

    async createLessonItems(batchId: string, unitIds: string[]) {
        const { error } = await supabase
            .from('lesson_items')
            .insert(unitIds.map(id => ({
                batch_id: batchId,
                ku_id: id,
                status: 'unseen'
            })));

        if (error) {
            console.error("[lessonRepository] Error creating lesson items:", error);
            throw error;
        }
    },

    async updateLessonItemStatus(batchId: string, unitId: string, status: string) {
        const { error } = await supabase
            .from('lesson_items')
            .update({ status: status })
            .match({ batch_id: batchId, ku_id: unitId });

        if (error) {
            console.error("[lessonRepository] Error updating lesson item status:", error);
        }
    },

    async completeLessonBatch(batchId: string) {
        const { error } = await supabase
            .from('lesson_batches')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', batchId);

        if (error) {
            console.error("[lessonRepository] Error completing lesson batch:", error);
        }
    },

    async fetchCurriculumStats() {
        const { data, error } = await supabase
            .from('knowledge_units')
            .select('level');

        if (error) return {};

        const counts: Record<number, number> = {};
        data.forEach(item => {
            counts[item.level] = (counts[item.level] || 0) + 1;
        });
        return counts;
    }
};
