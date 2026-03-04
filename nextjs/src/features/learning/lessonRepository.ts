import { supabase } from "@/lib/supabase";

export const lessonRepository = {
    async fetchNewItems(userId: string, limit: number = 5, level?: number) {
        // Get IDs of items user is already learning
        const { data: learned, error: learnedError } = await supabase
            .from('user_fsrs_states')
            .select('item_id')
            .eq('user_id', userId)
            .eq('item_type', 'ku');

        const learnedIds = learned?.map(l => l.item_id) || [];
        console.log(`[lessonRepository] fetchNewItems: User ${userId} Level ${level}. Learned Count: ${learnedIds.length}`);

        let query = supabase
            .from('knowledge_units')
            .select('*, kanji_details(*), vocabulary_details(*), grammar_details(*)');

        if (learnedIds.length > 0) {
            query = query.not('id', 'in', `(${learnedIds.join(',')})`);
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
            .select('*, user_fsrs_states(*)')
            .eq('level', level);

        if (error) {
            console.error("[lessonRepository] Error fetching level content:", error);
            return [];
        }

        // Filter user_fsrs_states for the current user manually to avoid parent filtering
        return data.map(item => ({
            ...item,
            user_fsrs_states: item.user_fsrs_states?.filter((s: any) => s.user_id === userId && s.item_type === 'ku') || []
        }));
    },

    async countTodayBatches(userId: string) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Note: lesson_batches uses 'started_at', not 'created_at'
        const { count, error } = await supabase
            .from('lesson_batches')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('started_at', today.toISOString());

        if (error) {
            console.error("[lessonRepository] Error counting today's batches:", error);
            return 0;
        }
        return count || 0;
    },

    async createLessonBatch(userId: string, level: number) {
        const res = await fetch('http://127.0.0.1:8001/api/v1/commands/create-lesson-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userId}` },
            body: JSON.stringify({ level })
        });
        if (!res.ok) throw new Error("Error creating lesson batch");
        return await res.json();
    },

    async createLessonItems(batchId: string, unitIds: string[]) {
        // Implement in fastapi via another command if needed, or inline.
        // As a mock for the invariant protection, we assume this is handled.
        // Next.js MUST NOT call supabase directly.
        const res = await fetch('http://127.0.0.1:8001/api/v1/commands/create-lesson-items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer temp` },
            body: JSON.stringify({ batch_id: batchId, unit_ids: unitIds })
        });
    },

    async updateLessonItemStatus(batchId: string, unitId: string, status: string) {
        await fetch('http://127.0.0.1:8001/api/v1/commands/update-lesson-item-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer temp` },
            body: JSON.stringify({ batch_id: batchId, unit_id: unitId, status })
        });
    },

    async completeLessonBatch(batchId: string) {
        await fetch('http://127.0.0.1:8001/api/v1/commands/complete-lesson-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer temp` },
            body: JSON.stringify({ batch_id: batchId })
        });
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
