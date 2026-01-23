import { calculateNextReview, Rating, SRSState } from './domain/SRSAlgorithm';
import { RatingSchema } from '@/lib/validation';
import { learningRepository } from './db';
import { kuRepository } from '../knowledge/db';
import { analyticsService } from '../analytics/service';
import { supabase } from '@/lib/supabase';

export async function submitReview(userId: string, kuId: string, rating: Rating, currentState: SRSState) {
    // 0. Validation
    RatingSchema.parse(rating);
    // SRSStateSchema.parse(currentState); 

    // 1. Calculate New State
    const { next_review, next_state } = calculateNextReview(currentState, rating);

    console.log(`[LearningService] Submitting review for ${kuId}:`, rating);

    await learningRepository.updateUserState(userId, kuId, {
        state: next_state.stage,
        next_review: next_review.toISOString(),
        reps: next_state.reps,
        lapses: next_state.lapses,
        last_review: new Date().toISOString(),
        stability: next_state.stability,
        difficulty: next_state.difficulty
    }, rating);

    // 2. Track Analytics
    const isNew = currentState.stage === 'new';
    const isCorrect = rating !== 'fail' && rating !== 'again';
    await analyticsService.logReview(isNew, isCorrect, userId);

    return { next_review, next_state };
}

export async function fetchDueItems(userId: string) {
    return learningRepository.fetchDueItems(userId);
}

export async function fetchNewItems(userId: string, deckId: string, limit: number = 5) {
    let level: number | undefined;
    if (deckId?.startsWith('level-')) {
        level = parseInt(deckId.split('-')[1]);
    }
    return learningRepository.fetchNewItems(userId, limit, level);
}


/**
 * 90% Knowledge Rule: 
 * If 90% of current level items are 'Mastered' (Stage >= Review),
 * then UNLOCK the next level for the user.
 */
export async function checkAndUnlockNextLevel(userId: string, currentLevel: number) {
    const stats = await fetchCurriculumStats();
    const totalInLevel = stats[currentLevel] || 0;
    if (totalInLevel === 0) return;

    const levelItems = await learningRepository.fetchLevelContent(currentLevel, userId);
    // Mastered = stage is 'review' or 'burned'
    const mastered = levelItems.filter(i => {
        const state = i.user_learning_states?.[0];
        return state && (state.state === 'review' || state.state === 'burned');
    }).length;

    const percentage = mastered / totalInLevel;

    if (percentage >= 0.9) {
        console.log(`[LearningService] Level ${currentLevel} mastered (${Math.round(percentage * 100)}%). Unlocking Level ${currentLevel + 1}`);
        const { data: profile } = await supabase.from('users').select('level').eq('id', userId).single();
        if (profile && profile.level === currentLevel) {
            await supabase.from('users').update({ level: currentLevel + 1 }).eq('id', userId);
        }
    }
}

export async function fetchDeckStats(userId: string, deckId: string) {
    let level: number | null = null;
    if (deckId.startsWith('level-')) {
        level = parseInt(deckId.split('-')[1]);
    }

    if (level) {
        // Trigger check as side effect for current level
        checkAndUnlockNextLevel(userId, level);

        // Fetch real counts for this level
        const counts = await fetchCurriculumStats();
        const total = counts[level] || 0;

        const levelItems = await learningRepository.fetchLevelContent(level, userId);
        const learned = levelItems.filter(i => i.user_learning_states?.length > 0).length;

        return {
            total,
            learned,
            due: levelItems.filter(i => {
                const state = i.user_learning_states?.[0];
                return state && new Date(state.next_review) <= new Date();
            }).length,
            new: total - learned
        };
    }

    return { total: 0, learned: 0, due: 0, new: 0 };
}

export async function fetchLevelContent(level: number, userId: string) {
    return learningRepository.fetchLevelContent(level, userId);
}

export async function fetchCurriculumStats() {
    return learningRepository.fetchCurriculumStats();
}

export async function fetchUserDashboardStats(userId: string) {
    console.log('[LearningService] fetchUserDashboardStats called for userId:', userId);

    try {
        const dueItems = await learningRepository.fetchDueItems(userId);
        const repoStats = await learningRepository.fetchStats(userId);
        const dailyStats = await analyticsService.getDashboardStats(userId);

        console.log('[LearningService] Live Data:', { due: dueItems?.length, learned: repoStats?.learned, today: dailyStats?.daily });

        // Calculate Type Mastery Percentages
        const typePercentages = {
            radical: repoStats ? Math.round((repoStats.typeMastery.radical / Math.max(repoStats.learned, 1)) * 100) : 0,
            kanji: repoStats ? Math.round((repoStats.typeMastery.kanji / Math.max(repoStats.learned, 1)) * 100) : 0,
            vocabulary: repoStats ? Math.round((repoStats.typeMastery.vocabulary / Math.max(repoStats.learned, 1)) * 100) : 0,
            grammar: repoStats ? Math.round((repoStats.typeMastery.grammar / Math.max(repoStats.learned, 1)) * 100) : 0,
        };

        const stats = {
            reviewsDue: dueItems?.length || 0,
            dueBreakdown: {
                learning: dueItems?.filter(i => i.state === 'learning').length || 0,
                review: dueItems?.filter(i => i.state === 'review').length || 0,
            },
            totalLearned: repoStats?.learned || 0,
            totalBurned: repoStats?.burned || 0,
            recentLevels: [1, 2, 3],
            retention: dailyStats?.daily.retention || 90, // Use real daily retention
            minutesSpent: dailyStats?.daily.minutes || 0,
            reviewsToday: dailyStats?.daily.reviews || 0,
            actionFrequencies: { analyze: 0, flashcard: repoStats?.learned || 0, srs: 0 },
            dailyReviews: repoStats?.last7Days || [0, 0, 0, 0, 0, 0, 0],
            forecast: Array.from({ length: 7 }, (_, i) => ({ day: `D${i}`, count: i === 0 ? (dueItems?.length || 0) : 0 })),
            heatmap: repoStats?.heatmap || {},
            typeMastery: typePercentages,
            totalKUCoverage: repoStats ? (repoStats.learned / repoStats.totalKUs) * 100 : 0
        };

        return stats;
    } catch (error) {
        console.error('[LearningService] Error fetching dashboard stats:', error);
        return {
            reviewsDue: 0, totalLearned: 0, totalBurned: 0,
            recentLevels: [1, 2, 3], retention: 0.9,
            actionFrequencies: { analyze: 0, flashcard: 0, srs: 0 },
            dailyReviews: [0, 0, 0, 0, 0, 0, 0],
            forecast: Array.from({ length: 7 }, (_, i) => ({ day: `D${i}`, count: 0 })),
            heatmap: Array.from({ length: 365 }, () => 0),
            typeMastery: { radical: 0, kanji: 0, vocabulary: 0, grammar: 0 },
            totalKUCoverage: 0
        };
    }
}

export async function fetchItemDetails(type: string, slug: string) {
    return kuRepository.getBySlug(slug, type as any);
}


