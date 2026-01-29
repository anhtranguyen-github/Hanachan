import { addDays } from 'date-fns';
import { supabase } from "@/lib/supabase";
import { Rating, SRSState } from "./domain/SRSAlgorithm";

export const learningRepository = {
    async fetchDueItems(userId: string) {
        const { data, error } = await supabase
            .from('user_learning_states')
            .select('*, knowledge_units(*, kanji_details(*), vocabulary_details(*), grammar_details(*))')
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

    async updateUserState(userId: string, kuId: string, updates: any, rating?: Rating) {
        const { error } = await supabase
            .from('user_learning_states')
            .upsert({
                user_id: userId,
                ku_id: kuId,
                ...updates
            }, {
                onConflict: 'user_id,ku_id'
            });

        if (error) {
            console.error("Error updating user state:", error);
            throw error;
        }

        // If a rating was provided, log it
        if (rating) {
            await supabase.from('user_learning_logs').insert({
                user_id: userId,
                ku_id: kuId,
                rating: rating,
                stability: updates.stability || 0,
                difficulty: updates.difficulty || 3.0,
                interval: Math.round((updates.stability || 0) * 1440) // in minutes
            });
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

    async getUserSettings(userId: string) {
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error("Error fetching user settings:", error);
            return { target_retention: 0.9 }; // Return fallback
        }

        if (!data) {
            // Check if user exists in users table first (required for FK constraint)
            const { data: userExists } = await supabase
                .from('users')
                .select('id')
                .eq('id', userId)
                .maybeSingle();

            if (!userExists) {
                // User doesn't exist in users table yet, return fallback without creating
                console.log("[getUserSettings] User not in users table yet, using defaults");
                return { target_retention: 0.9 };
            }

            // User exists, try to create default settings
            const { data: defaultSettings, error: createError } = await supabase
                .from('user_settings')
                .upsert({ user_id: userId, target_retention: 0.9 }, { onConflict: 'user_id' })
                .select()
                .single();
            if (createError) {
                console.error("Error creating default settings:", createError);
                return { target_retention: 0.9 }; // Return fallback
            }
            return defaultSettings;
        }

        return data;
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

        const stats = {
            learned: learnedStates?.length || 0,
            burned: learnedStates?.filter(s => s.state === 'burned').length || 0,
            typeMastery: { radical: 0, kanji: 0, vocabulary: 0, grammar: 0 },
            last7Days: [0, 0, 0, 0, 0, 0, 0],
            heatmap: {} as Record<string, number>,
            totalKUs: 0
        };

        // 2. Calculate Type Mastery
        learnedStates?.forEach(s => {
            const ku = Array.isArray(s.knowledge_units) ? s.knowledge_units[0] : s.knowledge_units;
            const type = (ku as any)?.type === 'vocab' ? 'vocabulary' : (ku as any)?.type;
            if (type && stats.typeMastery[type as keyof typeof stats.typeMastery] !== undefined) {
                stats.typeMastery[type as keyof typeof stats.typeMastery]++;
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
