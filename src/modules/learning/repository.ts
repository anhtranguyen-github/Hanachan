
import { createClient } from '@/lib/supabase/server';
import { FSRSParameters, FSRSReviewResult, SRSState } from './types';

export async function getLearningSettings(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('user_settings')
        .select('fsrs_weights, target_retention')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching learning settings:', error);
        return { weights: undefined, targetRetention: 0.9 };
    }

    return {
        weights: data.fsrs_weights,
        targetRetention: data.target_retention
    };
}

export async function getDueCards(userId: string, limit: number = 20) {
    const supabase = createClient();

    // Using the optimized index idx_uls_schedule
    const { data, error } = await supabase
        .from('user_learning_states')
        .select(`
            *,
            knowledge_units (
                *,
                ku_kanji (*),
                ku_vocabulary (*),
                ku_radicals (*),
                ku_grammar (*)
            )
        `)
        .eq('user_id', userId)
        .neq('state', 'Burned')
        .lte('next_review', new Date().toISOString())
        .order('next_review', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching due cards:', error);
        return [];
    }

    return data;
}

export async function updateLearningState(
    userId: string,
    kuId: string,
    result: FSRSReviewResult,
    reps: number,
    lapses: number
) {
    const supabase = createClient();

    const { error } = await supabase
        .from('user_learning_states')
        .upsert({
            user_id: userId,
            ku_id: kuId,
            state: result.next_state,
            stability: result.next_stability,
            difficulty: result.next_difficulty,
            next_review: result.next_review.toISOString(),
            last_review: new Date().toISOString(),
            reps: reps,
            lapses: lapses
        });

    if (error) {
        throw new Error(`Failed to update learning state: ${error.message}`);
    }
}

export async function logReviewHistory(
    userId: string,
    kuId: string,
    rating: number,
    current: FSRSParameters,
    result: FSRSReviewResult
) {
    const supabase = createClient();

    const { error } = await supabase
        .from('fsrs_history')
        .insert({
            user_id: userId,
            ku_id: kuId,
            rating: rating,
            prev_state: current.state,
            prev_stability: current.stability,
            prev_difficulty: current.difficulty,
            new_stability: result.next_stability,
            new_difficulty: result.next_difficulty,
            scheduled_days: result.scheduled_days,
            review_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error logging review history:', error);
    }
}
