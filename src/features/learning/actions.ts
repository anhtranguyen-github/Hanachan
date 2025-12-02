
'use server'

import { createClient } from '@/services/supabase/server';
import {
    getDueCards as getDueCardsRepo,
    getLearningSettings,
    updateLearningState,
    logReviewHistory
} from './db';
import { FSRSAlgorithm } from './srs-algorithm';
import { FSRSParameters, ReviewRating } from './types';
import { revalidatePath } from 'next/cache';

export async function getDueCardsAction(limit: number = 20) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    return await getDueCardsRepo(user.id, limit);
}

export async function submitReviewAction(kuId: string, rating: ReviewRating) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    // 1. Get current learning state
    const { data: currentState, error: fetchError } = await supabase
        .from('user_learning_states')
        .select('*')
        .eq('user_id', user.id)
        .eq('ku_id', kuId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
        throw new Error(`Failed to fetch current state: ${fetchError.message}`);
    }

    // Default params for New cards
    const params: FSRSParameters = currentState ? {
        stability: currentState.stability,
        difficulty: currentState.difficulty,
        elapsed_days: 0, // Will be calculated in FSRS class if needed, or we compute here
        scheduled_days: 0,
        state: currentState.state,
        last_review: currentState.last_review,
        reps: currentState.reps,
        lapses: currentState.lapses
    } : {
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        state: 'New',
        reps: 0,
        lapses: 0
    };

    // 2. Get User FSRS Settings
    const settings = await getLearningSettings(user.id);
    const fsrs = new FSRSAlgorithm(settings.weights, settings.targetRetention);

    // 3. Calculate next state
    const result = fsrs.calculateNextState(params, rating);

    // 4. Update Database
    const nextReps = params.reps + 1;
    const nextLapses = rating === 1 ? params.lapses + 1 : params.lapses;

    await updateLearningState(user.id, kuId, result, nextReps, nextLapses);
    await logReviewHistory(user.id, kuId, rating, params, result);

    revalidatePath('/study/review');

    return result;
}
