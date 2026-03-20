import { supabase } from "@/lib/supabase";

let _curriculumStatsCache: Record<number, number> | null = null;
let _curriculumStatsCacheTime: number = 0;

export const lessonRepository = {
    async fetchNewItems(userId: string, limit: number = 5, level?: number, deckId?: string) {
        // Get IDs of items user is already learning
        const { data: learned, error: learnedError } = await supabase
            .from('user_fsrs_states')
            .select('item_id')
            .eq('user_id', userId)
            .eq('item_type', 'ku');

        const learnedIds = learned?.map(l => l.item_id) || [];
        console.log(`[lessonRepository] fetchNewItems: User ${userId} Level ${level} Deck ${deckId}. Learned Count: ${learnedIds.length}`);

        let query = supabase
            .from('knowledge_units')
            .select('*, kanji_details(*), vocabulary_details(*), grammar_details(*)');

        if (learnedIds.length > 0) {
            // Because URL length limits apply to `in` filters (approx 200 UUIDs),
            // we will fetch all items in the level/deck and filter locally.
            // This is safer and avoids query string overflow.
        }

        if (deckId) {
            // Filter by deck items
            const { data: deckItems } = await supabase.from('deck_items').select('item_id').eq('deck_id', deckId);
            const itemIds = deckItems?.map(i => i.item_id) || [];
            if (itemIds.length > 0) {
                query = query.in('id', itemIds);
            } else {
                return [];
            }
        } else if (level) {
            query = query.eq('level', level);
        }

        // Since we removed `.not('in')` to avoid URL limits, fetch more and filter locally
        const { data, error } = await query
            .limit(limit * 50) // Fetch a larger batch
            .order('level', { ascending: true })
            .order('slug', { ascending: true });

        if (error) {
            console.error("[lessonRepository] Error fetching new items:", error);
            return [];
        }

        // Filter locally
        const unlearned = data.filter(ku => !learnedIds.includes(ku.id)).slice(0, limit);

        return unlearned.map(ku => ({
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
        const { data, error } = await supabase
            .from('lesson_batches')
            .insert({
                user_id: userId,
                level: level,
                status: 'in_progress',
                started_at: new Date().toISOString()
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async createLessonItems(batchId: string, unitIds: string[]) {
        const itemsToInsert = unitIds.map(id => ({
            batch_id: batchId,
            ku_id: id,
            status: 'unseen'
        }));
        const { error } = await supabase
            .from('lesson_items')
            .insert(itemsToInsert);
        if (error) throw error;
    },

    async updateLessonItemStatus(batchId: string, unitId: string, status: string) {
        const { error } = await supabase
            .from('lesson_items')
            .update({ status })
            .eq('batch_id', batchId)
            .eq('ku_id', unitId);
        if (error) throw error;
    },

    async completeLessonBatch(batchId: string) {
        const { error } = await supabase
            .from('lesson_batches')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString()
            })
            .eq('id', batchId);
        if (error) throw error;
    },

    async fetchCurriculumStats() {
        const now = Date.now();
        // Cache curriculum stats for 1 hour to prevent heavy sequential DB hits
        if (_curriculumStatsCache && (now - _curriculumStatsCacheTime < 3600000)) {
            return _curriculumStatsCache;
        }

        const { data, error } = await supabase
            .from('knowledge_units')
            .select('level');

        if (error) return {};

        const counts: Record<number, number> = {};
        data.forEach(item => {
            counts[item.level] = (counts[item.level] || 0) + 1;
        });
        
        _curriculumStatsCache = counts;
        _curriculumStatsCacheTime = now;
        return counts;
    }
};
