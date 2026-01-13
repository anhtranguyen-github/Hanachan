import { createClient } from '@/services/supabase/client';
import { RatingSchema, SRSStateSchema } from '@/lib/validation';
import { z } from 'zod';
import { calculateNextReview, Rating, SRSState } from './algorithm';

import { MockDB } from '@/lib/mock-db';

const FORCE_MOCK = true;

export async function submitReview(userId: string, kuId: string, rating: Rating, currentState: SRSState) {
    // 0. Validation
    RatingSchema.parse(rating);
    SRSStateSchema.parse(currentState);
    z.string().uuid().parse(userId);

    // 1. Calculate New State
    const { next_review, next_state } = calculateNextReview(currentState, rating);

    if (FORCE_MOCK) {
        console.log(`[MockDB] Submitting review for ${kuId}:`, rating);
        await MockDB.updateUserState(userId, kuId, {
            state: next_state.stage,
            next_review: next_review.toISOString(),
            srs_stage: next_state.streak,
            last_review: new Date().toISOString(),
            stability: next_state.ease_factor
        });
        return { next_review, next_state };
    }

    const supabase = createClient();

    // 2. Optimistic UI update / Database Update
    const { error } = await supabase
        .from('user_learning_states')
        .update({
            state: next_state.stage,
            next_review: next_review.toISOString(),
            srs_stage: next_state.streak, // Mapping streak to explicit "level"
            last_review: new Date().toISOString(),
            stability: next_state.ease_factor,
            // We might store full json state later, for now we map to columns we have
        })
        .eq('user_id', userId)
        .eq('ku_id', kuId);

    if (error) {
        console.error("SRS Update Failed", error);
        throw error;
    }

    return { next_review, next_state };
}

export async function fetchDueItems(userId: string, deckId?: string) {
    if (FORCE_MOCK) {
        return MockDB.fetchDueItems(userId);
    }

    const supabase = createClient();

    let query = supabase
        .from('user_learning_states')
        .select(`
            *,
            knowledge_units!inner (
                slug,
                character,
                type,
                level,
                meaning,
                ku_kanji(meaning_data, reading_data),
                ku_vocabulary(meaning_data, reading_primary),
                ku_radicals(name)
            )
        `)
        .eq('user_id', userId)
        .lte('next_review', new Date().toISOString())
        .order('next_review', { ascending: true })
        .limit(20);

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
        return MockDB.fetchDueItems(userId); // Fallback
    }

    return data;
}

export async function fetchNewItems(userId: string, deckId?: string, limit = 5) {
    if (FORCE_MOCK) {
        // Parse level from deckId if possible, e.g., 'level-5'
        let level: number | undefined;
        if (deckId?.startsWith('level-')) {
            level = parseInt(deckId.split('-')[1]);
        }
        return MockDB.fetchNewItems(userId, limit, level);
    }

    const supabase = createClient();

    // Logic: Find Items in Knowledge Units that are NOT in user_learning_states
    // This is hard with simple join. 
    // Alternative: Find items in user_learning_states where state = 'new'

    let query = supabase
        .from('user_learning_states')
        .select(`
            *,
            knowledge_units!inner (
                slug,
                character,
                type,
                level,
                meaning,
                ku_kanji(meaning_data, reading_data),
                ku_vocabulary(meaning_data, reading_primary),
                ku_radicals(name),
                ku_grammar(meaning_summary, structure_json)
            )
        `)
        .eq('user_id', userId)
        .eq('state', 'new')
        .limit(limit);

    if (deckId?.startsWith('level-')) {
        const level = parseInt(deckId.split('-')[1]);
        if (!isNaN(level)) {
            query = query.eq('knowledge_units.level', level);
        }
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
        return MockDB.fetchNewItems(userId, limit); // Fallback
    }

    return data;
}

export async function fetchDeckStats(userId: string, deckId: string) {
    if (FORCE_MOCK) {
        // Simple mock stats for now
        // TODO: Add strict stats calculation to MockDB
        return {
            total: 100,
            learned: 20,
            due: 5,
            new: 75
        };
    }

    const supabase = createClient();

    // Parse Level
    let level: number | null = null;
    if (deckId.startsWith('level-')) {
        level = parseInt(deckId.split('-')[1]);
    }

    if (!level) return { total: 0, learned: 0, due: 0, new: 0 };

    // 1. Total Items in Level
    const { count: total, error: errTotal } = await supabase
        .from('knowledge_units')
        .select('*', { count: 'exact', head: true })
        .eq('level', level);

    if (errTotal) console.error("Error fetching total", errTotal);

    // 2. User States for this Level
    const { data: states, error: errStates } = await supabase
        .from('user_learning_states')
        .select(`
            state,
            next_review,
            knowledge_units!inner(level)
        `)
        .eq('user_id', userId)
        .eq('knowledge_units.level', level);

    if (errStates) console.error("Error fetching states", errStates);

    const learned = states?.length || 0;
    const due = states?.filter(s => new Date(s.next_review) <= new Date()).length || 0;

    // In our model, items NOT in user_learning_states are "Locked" or "Not Started".
    // Items IN user_learning_states with state='new' are "New/To Do".

    const itemsInNewState = states?.filter(s => s.state === 'new').length || 0;

    // NOTE: This assumes we pre-populated user_learning_states for all items as 'new'.
    // If we rely on lazily creating them, then "new" = Total - Learned (non-new).
    // Let's assume lazy creation:

    const totalKnown = learned; // Rows existing in states table
    const locked = (total || 0) - totalKnown;

    const stats = {
        total: total || 0,
        learned: learned - itemsInNewState,
        due,
        new: itemsInNewState + locked
    };

    // FALLBACK: If everything is 0, use mock stats for this level
    if (stats.total === 0) {
        // Fallback to MockDB if live data is missing
        const mockStats = await MockDB.fetchCurriculumStats();
        const mockCount = mockStats[level] || 100;
        return {
            total: mockCount,
            learned: Math.floor(mockCount * 0.1),
            due: 5,
            new: Math.floor(mockCount * 0.9)
        };
    }

    return stats;
}

export async function fetchLevelContent(level: number, userId: string) {
    if (FORCE_MOCK) {
        return MockDB.fetchLevelContent(level, userId);
    }
    const supabase = createClient();

    // 1. Fetch KUs
    const { data: kuData, error: kuError } = await supabase
        .from('knowledge_units')
        .select(`
            slug,
            character,
            type,
            meaning,
            level,
            ku_kanji(meaning_data, reading_data),
            ku_vocabulary(meaning_data, reading_primary),
            ku_radicals(name)
        `)
        .eq('level', level)
        .order('slug', { ascending: true });

    if (kuError || !kuData || kuData.length === 0) {
        return MockDB.fetchLevelContent(level, userId);
    }

    // 2. Fetch States
    const slugs = kuData.map(k => k.slug);
    const { data: stateData } = await supabase
        .from('user_learning_states')
        .select('ku_id, state, next_review, srs_stage')
        .eq('user_id', userId)
        .in('ku_id', slugs);

    const stateMap = (stateData || []).reduce((acc: any, s: any) => {
        acc[s.ku_id] = s;
        return acc;
    }, {});

    return kuData.map(ku => ({
        ...ku,
        user_learning_states: stateMap[ku.slug] ? [stateMap[ku.slug]] : []
    }));
}

export async function fetchCurriculumStats() {
    if (FORCE_MOCK) {
        return MockDB.fetchCurriculumStats();
    }
    const supabase = createClient();

    // Get counts grouping by level using RPC or raw query is ideal, doing simple fetch for now.
    // NOTE: This might be heavy if dataset is large. Optimize later.
    // For now, let's just fetch count of KU per level.

    // Using a lighter query, maybe just ID and level
    const { data: kuData, error: kuError } = await supabase
        .from('knowledge_units')
        .select('level');

    if (kuError || !kuData || kuData.length === 0) {
        return MockDB.fetchCurriculumStats();
    }

    const counts: Record<number, number> = {};
    kuData.forEach(k => {
        if (k.level) {
            counts[k.level] = (counts[k.level] || 0) + 1;
        }
    });

    return counts;
}

export async function fetchUserDashboardStats(userId: string) {
    if (FORCE_MOCK) {
        return MockDB.fetchUserDashboardStats(userId);
    }
    const supabase = createClient();

    // 1. Total Reviews Due
    const { count: dueCount, error: errDue } = await supabase
        .from('user_learning_states')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .lte('next_review', new Date().toISOString());

    // 2. Total Learned (Any state)
    const { count: learnedCount, error: errLearned } = await supabase
        .from('user_learning_states')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    // 3. Activity (Fake heatmap data for now OR aggregated logs if we had them)
    // We don't have an activity_logs table in the schema context yet, 
    // so we'll mock the streak and heatmap.

    // 4. Recent Levels
    const { data: levelProgress, error: errProgress } = await supabase
        .from('user_learning_states')
        .select(`
            knowledge_units!inner(level)
        `)
        .eq('user_id', userId)
        .limit(100);

    // Aggregate levels
    const activeLevels = new Set<number>();
    levelProgress?.forEach((p: any) => {
        const ku = Array.isArray(p.knowledge_units) ? p.knowledge_units[0] : p.knowledge_units;
        if (ku?.level) activeLevels.add(ku.level);
    });

    const recentLevels = Array.from(activeLevels).sort((a, b) => a - b).slice(0, 3);

    const result = {
        reviewsDue: dueCount || 0,
        totalLearned: learnedCount || 0,
        streak: 5, // Mock
        recentLevels
    };

    // FALLBACK: If user is new, give them some "Starter" stats to look at
    if (result.totalLearned === 0 && result.recentLevels.length === 0) {
        return MockDB.fetchUserDashboardStats(userId);
    }

    return result;
}

export async function fetchItemDetails(type: string, slug: string) {
    if (FORCE_MOCK) {
        return MockDB.fetchItemDetails(type, slug);
    }
    const supabase = createClient();

    // Construct search slug typically like "kanji/火" 
    const fullSlug = `${type}/${decodeURIComponent(slug)}`;

    const { data, error } = await supabase
        .from('knowledge_units')
        .select(`
            *,
            knowledge_units_similarity!input_ku_id(
                score,
                target_ku:target_ku_id(slug, character, type, meaning)
            ),
            user_learning_states(state, next_review, srs_stage, stability),
            ku_kanji(*),
            ku_vocabulary(*),
            ku_radicals(*)
        `)
        .eq('slug', fullSlug)
        .single();

    if (error) {
        console.error("Fetch Item Details Error", error);
        return MockDB.fetchItemDetails(type, slug)
    }

    return data;
}

