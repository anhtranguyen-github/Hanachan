import { addDays } from 'date-fns';
import { supabase } from "@/lib/supabase";
import { Rating, SRSState } from "./domain/SRSAlgorithm";

export const learningRepository = {
    async fetchDueItems(userId: string) {
        const { data, error } = await supabase
            .from('user_learning_states')
            .select('*, facet, knowledge_units(*, kanji_details(*), vocabulary_details(*), grammar_details(*))')
            .eq('user_id', userId)
            .neq('state', 'burned')
            .lte('next_review', new Date().toISOString())
            .order('next_review', { ascending: true });

        if (error) {
            console.error("Error fetching due items:", error);
            return [];
        }

        return data;
    },

    async fetchNewItems(userId: string, limit: number = 5, level?: number) {
        // Get IDs of items user is already learning
        const { data: learned, error: learnedError } = await supabase
            .from('user_learning_states')
            .select('ku_id')
            .eq('user_id', userId);

        const learnedIds = learned?.map(l => l.ku_id) || [];
        console.log(`[DB] fetchNewItems: User ${userId} Level ${level}. Learned Count: ${learnedIds.length}`);

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
            console.error("[DB] Error fetching new items:", error);
            return [];
        }

        console.log(`[DB] fetchNewItems: Found ${data?.length} items.`);

        return data.map(ku => ({
            user_id: userId,
            ku_id: ku.id,
            state: 'new',
            knowledge_units: ku,
            srs_stage: 0,
            next_review: null
        }));
    },

    async updateUserState(userId: string, kuId: string, facet: string, updates: any, rating?: Rating) {
        console.log(`[DB] updateUserState: ${userId}, ${kuId}, ${facet}`, updates);

        const { error } = await supabase
            .from('user_learning_states')
            .upsert({
                user_id: userId,
                ku_id: kuId,
                facet: facet,
                ...updates
            }, {
                onConflict: 'user_id,ku_id,facet'
            });

        if (error) {
            console.error("[DB] Error updating user state:", error);
            throw error;
        }

        console.log(`[DB] State updated successfully for ${kuId}-${facet}`);

        // If a rating was provided, log it
        if (rating) {
            const { error: logError } = await supabase.from('user_learning_logs').insert({
                user_id: userId,
                ku_id: kuId,
                facet: facet,
                rating: rating,
                stability: updates.stability || 0,
                difficulty: updates.difficulty || 3.0,
                interval: Math.round((updates.stability || 0) * 1440) // in minutes
            });

            if (logError) {
                console.error("[DB] Error inserting learning log:", logError);
            } else {
                console.log(`[DB] Learning log inserted for ${kuId}-${facet}`);
            }
        }
    },

    async fetchLevelContent(level: number, userId: string) {
        const { data, error } = await supabase
            .from('knowledge_units')
            .select('*, user_learning_states(*)')
            .eq('level', level);

        if (error) {
            console.error("Error fetching level content:", error);
            return [];
        }

        // Filter user_learning_states for the current user manually to avoid parent filtering
        return data.map(item => ({
            ...item,
            user_learning_states: item.user_learning_states?.filter((s: any) => s.user_id === userId) || []
        }));
    },

    // --- Persistent Session Tracking ---

    async createReviewSession(userId: string, totalItems: number) {
        const { data, error } = await supabase
            .from('review_sessions')
            .insert({
                user_id: userId,
                total_items: totalItems,
                completed_items: 0,
                status: 'active'
            })
            .select()
            .single();

        if (error) {
            console.error("[DB] Error creating review session:", error);
            throw error;
        }
        return data;
    },

    async createReviewSessionItems(sessionId: string, items: { ku_id: string, facet: string }[]) {
        const { error } = await supabase
            .from('review_session_items')
            .insert(items.map(i => ({
                session_id: sessionId,
                ku_id: i.ku_id,
                facet: i.facet,
                status: 'pending'
            })));

        if (error) {
            console.error("[DB] Error creating review session items:", error);
            throw error;
        }
    },

    async updateReviewSessionItem(sessionId: string, kuId: string, facet: string, status: string, rating?: Rating) {
        const { error } = await supabase
            .from('review_session_items')
            .update({
                status: status,
                first_rating: rating,
                updated_at: new Date().toISOString()
            })
            .match({ session_id: sessionId, ku_id: kuId, facet: facet });

        if (error) {
            console.error("[DB] Error updating review session item:", error);
        }
    },

    async completeReviewSession(sessionId: string, completedItems: number) {
        const { error } = await supabase
            .from('review_sessions')
            .update({
                status: 'finished',
                completed_items: completedItems,
                completed_at: new Date().toISOString()
            })
            .eq('id', sessionId);

        if (error) {
            console.error("[DB] Error completing review session:", error);
        }
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
            console.error("[DB] Error creating lesson batch:", error);
            throw error;
        }
        return data;
    },

    async createLessonItems(batchId: string, kuIds: string[]) {
        const { error } = await supabase
            .from('lesson_items')
            .insert(kuIds.map(id => ({
                batch_id: batchId,
                ku_id: id,
                status: 'unseen'
            })));

        if (error) {
            console.error("[DB] Error creating lesson items:", error);
            throw error;
        }
    },

    async updateLessonItemStatus(batchId: string, kuId: string, status: string) {
        const { error } = await supabase
            .from('lesson_items')
            .update({ status: status })
            .match({ batch_id: batchId, ku_id: kuId });

        if (error) {
            console.error("[DB] Error updating lesson item status:", error);
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
            console.error("[DB] Error completing lesson batch:", error);
        }
    },

    async fetchStats(userId: string) {
        // 1. Fetch Current States Summary
        const { data: learnedStates, error: statsError } = await supabase
            .from('user_learning_states')
            .select('state, ku_id, last_review, knowledge_units(type)')
            .eq('user_id', userId);

        if (statsError) {
            console.error("Error fetching learning stats:", statsError);
            return null;
        }

        // 2. Aggregate counts by KU
        const kuGroups: Record<string, { total: number, mastered: number, burned: number, type: string }> = {};
        learnedStates?.forEach(s => {
            const ku = Array.isArray(s.knowledge_units) ? s.knowledge_units[0] : s.knowledge_units;
            const type = (ku as any)?.type === 'vocab' ? 'vocabulary' : (ku as any)?.type;

            if (!kuGroups[s.ku_id]) {
                kuGroups[s.ku_id] = { total: 0, mastered: 0, burned: 0, type: type || 'unknown' };
            }
            kuGroups[s.ku_id].total++;
            if (s.state === 'burned') kuGroups[s.ku_id].burned++;
            if (s.state === 'review' || s.state === 'burned') kuGroups[s.ku_id].mastered++;
        });

        const uniqueKUs = Object.values(kuGroups);
        const stats = {
            learned: uniqueKUs.length,
            mastered: uniqueKUs.filter(g => g.mastered === g.total).length,
            burned: uniqueKUs.filter(g => g.burned === g.total).length,
            typeMastery: { radical: 0, kanji: 0, vocabulary: 0, grammar: 0 },
            last7Days: [0, 0, 0, 0, 0, 0, 0],
            heatmap: {} as Record<string, number>,
            totalKUs: 0
        };

        uniqueKUs.forEach(g => {
            if (g.type && stats.typeMastery[g.type as keyof typeof stats.typeMastery] !== undefined) {
                stats.typeMastery[g.type as keyof typeof stats.typeMastery]++;
            }
        });

        // 3. Fetch Activity Logs for Heatmap and Last 7 Days
        const { data: logs } = await supabase
            .from('user_learning_logs')
            .select('created_at')
            .eq('user_id', userId)
            .gte('created_at', addDays(new Date(), -365).toISOString());

        if (logs) {
            const now = new Date();
            logs.forEach(log => {
                const date = new Date(log.created_at);
                const dateKey = date.toISOString().split('T')[0];
                stats.heatmap[dateKey] = (stats.heatmap[dateKey] || 0) + 1;

                const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
                if (diffDays >= 0 && diffDays < 7) {
                    stats.last7Days[6 - diffDays]++;
                }
            });
        }

        // 4. Get Total KU Count
        const { count } = await supabase
            .from('knowledge_units')
            .select('*', { count: 'exact', head: true });

        stats.totalKUs = count || 1;

        return stats;
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
