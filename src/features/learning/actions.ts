'use server'

import { createClient } from '@/services/supabase/server';
import { learningService } from './service';
import { ReviewRating } from './types';
import { revalidatePath } from 'next/cache';

export async function getDueCardsAction(limit: number = 20) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    return await learningService.getDueCards(user.id, limit);
}

export async function submitReviewAction(kuId: string, rating: ReviewRating) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Unauthorized');
    }

    const result = await learningService.submitReview(user.id, kuId, rating);

    revalidatePath('/study/review');

    return result;
}
