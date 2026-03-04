import { addDays } from 'date-fns';
import { supabase } from "@/lib/supabase";
import { Rating } from "./domain/SRSAlgorithm";
import { HanaTime } from "@/lib/time";

export const srsRepository = {
    async fetchDueItems(userId: string) {
        const { data, error } = await supabase
            .from('user_fsrs_states')
            .select('*, facet, knowledge_units!inner(*, kanji_details(*), vocabulary_details(*), grammar_details(*))')
            .eq('user_id', userId)
            .eq('item_type', 'ku')
            .neq('state', 'burned')
            .lte('next_review', HanaTime.getNowISO())
            .order('next_review', { ascending: true });

        if (error) {
            console.error("[srsRepository] Error fetching due items:", error);
            return [];
        }

        // Map item_id back to ku_id for backward compatibility
        return data?.map((item: any) => ({
            ...item,
            ku_id: item.item_id
        })) || [];
    },

    async updateUserState(userId: string, unitId: string, facet: string, updates: any, rating?: Rating) {
        console.log(`[srsRepository] updateUserState: ${userId}, ${unitId}, ${facet}`, updates);

        const { error } = await supabase
            .from('user_fsrs_states')
            .upsert({
                user_id: userId,
                item_id: unitId,
                item_type: 'ku',
                facet: facet,
                ...updates
            }, {
                onConflict: 'user_id,item_id,item_type,facet'
            });

        if (error) {
            console.error("[srsRepository] Error updating user state:", error);
            throw error;
        }

        console.log(`[srsRepository] State updated successfully for ${unitId}-${facet}`);

        // If a rating was provided, log it
        if (rating) {
            let numRating = 3;
            if (rating === 'again') numRating = 1;
            else if (rating === 'pass') numRating = 3;

            const { error: logError } = await supabase.from('fsrs_review_logs').insert({
                user_id: userId,
                item_id: unitId,
                item_type: 'ku',
                facet: facet,
                rating: numRating,
                state: updates.state || 'review',
                stability: updates.stability || 0,
                difficulty: updates.difficulty || 3.0,
                interval_days: updates.stability || 0
            });

            if (logError) {
                console.error("[srsRepository] Error inserting learning log:", logError);
            } else {
                console.log(`[srsRepository] Learning log inserted for ${unitId}-${facet}`);
            }
        }
    },
    async updateKUNote(userId: string, kuId: string, note: string) {
        console.log(`[srsRepository] updateKUNote: ${userId}, ${kuId}`);
        // First get the existing notes to append to them properly
        const { data: existingState } = await supabase
            .from('user_fsrs_states')
            .select('notes')
            .eq('user_id', userId)
            .eq('item_id', kuId)
            .eq('item_type', 'ku')
            // Just grab the primary meaning facet or any to attach the note to the KU conceptually
            .limit(1)
            .maybeSingle();

        const existingNotes = existingState?.notes || '';
        const updatedNotes = existingNotes ? `${existingNotes}\n- ${note.trim()}` : `- ${note.trim()}`;

        const { error } = await supabase
            .from('user_fsrs_states')
            .update({ notes: updatedNotes })
            .eq('user_id', userId)
            .eq('item_id', kuId)
            .eq('item_type', 'ku');

        if (error) {
            console.error("[srsRepository] Error updating KU note:", error);
            throw error;
        }

        return updatedNotes;
    },

    // --- Persistent Review Session Tracking ---

    async createReviewSession(userId: string, itemIds: string[]) {
        const res = await fetch('http://127.0.0.1:8001/api/v1/commands/create-review-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer temp` },
            body: JSON.stringify({ user_id: userId, item_ids: itemIds })
        });
        const data = await res.json();
        if (!res.ok) {
            console.error("[srsRepository] Error creating review session:", data);
            throw new Error(data.message || 'Failed to create review session');
        }
        return data.session_id;
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
            console.error("[srsRepository] Error creating review session items:", error);
            throw error;
        }
    },

    async updateReviewSessionItem(sessionId: string, unitId: string, facet: string, status: string, rating?: Rating, wrongCount?: number, attempts?: number) {
        const updates: any = {
            status: status,
            updated_at: HanaTime.getNowISO()
        };

        if (rating) updates.first_rating = rating;
        // Note: wrong_count column does not exist in schema - use attempts to track total attempts
        if (attempts !== undefined) updates.attempts = attempts;

        const { error } = await supabase
            .from('review_session_items')
            .update(updates)
            .match({ session_id: sessionId, ku_id: unitId, facet: facet });

        if (error) {
            console.error("[srsRepository] Error updating review session item:", error);
        }
    },

    async incrementSessionProgress(sessionId: string) {
        // We can't easily do atomic increment in Supabase without RPC, but we can update by fetching or just setting if we have the count.
        // For simplicity, let's just update the count in completeReviewSession or similar.
        // Alternatively, if the controller tracks it, it can call completeReviewSession at the end.
        // But ReviewSessionController calls incrementSessionProgress per item.
        const { data, error } = await supabase.rpc('increment_review_session_progress', { row_id: sessionId });
        if (error) {
            // Fallback if RPC not defined: fetch and update
            const { data: session } = await supabase.from('review_sessions').select('completed_items').eq('id', sessionId).single();
            if (session) {
                await supabase.from('review_sessions').update({ completed_items: session.completed_items + 1 }).eq('id', sessionId);
            }
        }
    },

    async finishReviewSession(sessionId: string) {
        const { error } = await supabase
            .from('review_sessions')
            .update({
                status: 'finished',
                completed_at: HanaTime.getNowISO()
            })
            .eq('id', sessionId);

        if (error) {
            console.error("[srsRepository] Error finishing review session:", error);
        }
    },

    async completeReviewSession(sessionId: string, completedItems: number) {
        const { error } = await supabase
            .from('review_sessions')
            .update({
                status: 'finished',
                completed_items: completedItems,
                completed_at: HanaTime.getNowISO()
            })
            .eq('id', sessionId);

        if (error) {
            console.error("[srsRepository] Error completing review session:", error);
        }
    },

    // --- Analytics ---

    async fetchStats(userId: string) {
        // 1. Fetch Current States Summary
        const { data: learnedStates, error: statsError } = await supabase
            .from('user_fsrs_states')
            .select('state, ku_id, last_review, stability, knowledge_units(type)')
            .eq('user_id', userId);

        if (statsError) {
            console.error("[srsRepository] Error fetching learning stats:", statsError);
            return null;
        }

        // 2. Aggregate counts by KU
        const unitGroups: Record<string, { total: number, mastered: number, burned: number, type: string }> = {};
        learnedStates?.forEach(s => {
            const ku = Array.isArray(s.knowledge_units) ? s.knowledge_units[0] : s.knowledge_units;
            const type = (ku as any)?.type === 'vocab' ? 'vocabulary' : (ku as any)?.type;

            if (!unitGroups[s.ku_id]) {
                unitGroups[s.ku_id] = { total: 0, mastered: 0, burned: 0, type: type || 'unknown' };
            }
            unitGroups[s.ku_id].total++;
            if (s.state === 'burned') unitGroups[s.ku_id].burned++;
            if (s.state === 'review' || s.state === 'burned') unitGroups[s.ku_id].mastered++;
        });

        const uniqueKUs = Object.values(unitGroups);
        const stats = {
            learned: uniqueKUs.length,
            mastered: uniqueKUs.filter(g => g.mastered > 0 && g.mastered === g.total).length,
            burned: uniqueKUs.filter(g => g.burned > 0 && g.burned === g.total).length,
            typeMastery: { radical: 0, kanji: 0, vocabulary: 0, grammar: 0 },
            srsSpread: {
                apprentice: 0,
                guru: 0,
                master: 0,
                enlightened: 0,
                burned: 0
            },
            last7Days: [0, 0, 0, 0, 0, 0, 0],
            heatmap: {} as Record<string, number>,
            totalKUs: 0
        };

        // Calculate Spread from raw states
        learnedStates?.forEach(s => {
            const stab = s.stability || 0;
            if (s.state === 'burned') stats.srsSpread.burned++;
            else if (stab >= 30.0) stats.srsSpread.enlightened++;
            else if (stab >= 14.0) stats.srsSpread.master++;
            else if (stab >= 3.0) stats.srsSpread.guru++;
            else stats.srsSpread.apprentice++;
        });

        uniqueKUs.forEach(g => {
            if (g.type && stats.typeMastery[g.type as keyof typeof stats.typeMastery] !== undefined) {
                if (g.mastered > 0 && g.mastered === g.total) {
                    stats.typeMastery[g.type as keyof typeof stats.typeMastery]++;
                }
            }
        });

        // 3. Fetch Activity Logs for Heatmap and Last 7 Days
        const { data: logs } = await supabase
            .from('user_learning_logs')
            .select('created_at')
            .eq('user_id', userId)
            .gte('created_at', addDays(HanaTime.getNow(), -365).toISOString());

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

    async fetchReviewForecast(userId: string) {
        const { data, error } = await supabase
            .from('user_fsrs_states')
            .select('next_review')
            .eq('user_id', userId)
            .neq('state', 'burned')
            .not('next_review', 'is', null)
            .order('next_review', { ascending: true });

        if (error) {
            console.error("[srsRepository] Error fetching forecast data:", error);
            return [];
        }

        return data;
    }
};
