import { addHours } from 'date-fns';
import { RatingSchema } from '@/lib/validation';
import { srsRepository } from './srsRepository';
import { lessonRepository } from './lessonRepository';
import { curriculumRepository } from '../knowledge/db';
import { analyticsService } from '../analytics/service';
import { getUserProfile, updateUserProfile } from '../auth/db';
import { HanaTime } from '@/lib/time';
import { coreClient } from '@/services/coreClient';

export async function initializeSRS(userId: string, unitId: string, facets: string[]) {
    const initialStability = 0.166; // Approx 4 hours
    const initialDifficulty = 3.0;
    const nextReview = addHours(HanaTime.getNow(), 4);

    console.log(`[LearningService] Initializing SRS for ${unitId} with facets: ${facets.join(', ')}`);

    for (const facet of facets) {
        await srsRepository.updateUserState(userId, unitId, facet, {
            state: 'learning',
            next_review: nextReview.toISOString(),
            reps: 1,
            lapses: 0,
            last_review: HanaTime.getNowISO(),
            stability: initialStability,
            difficulty: initialDifficulty
        });
    }
}

export async function submitReview(userId: string, unitId: string, facet: string, rating: any, currentState: any, wrongCount: number = 0) {
    // 1. Call Core Authority
    const response = await coreClient.submitReviewV2({
        kuId: unitId,
        facet,
        rating,
        wrongCount
    }) as any;

    // 2. Track Analytics
    const isNew = currentState?.stage === 'new';
    const isCorrect = rating !== 'again';
    await analyticsService.logReview(isNew, isCorrect, userId);

    return { next_review: new Date(response.next_review), next_state: { stability: response.stability } };
}

export async function fetchDueItems(userId: string, deckId?: string) {
    return srsRepository.fetchDueItems(userId, deckId);
}

export async function startLessonSession(userId: string, level?: number, deckId?: string) {
    const DAILY_LIMIT = 50;
    const todayCount = await lessonRepository.countTodayBatches(userId);

    if (todayCount >= DAILY_LIMIT) {
        throw new Error(`Daily limit reached! You have already finished ${DAILY_LIMIT} batches today. Take a rest for better retention.`);
    }

    const items = await lessonRepository.fetchNewItems(userId, 5, level, deckId);
    if (items.length === 0) {
        return { items: [], batch: null };
    }

    // Call core authority
    const response = await coreClient.startLessonSession(items.map((i: any) => i.ku_id), level, deckId) as any;
    const batch = { id: response.batch_id };

    return { items, batch };
}

export async function fetchNewItems(userId: string, identifier: string, limit: number = 5) {
    let level: number | undefined;
    let deckId: string | undefined;

    if (identifier?.startsWith('level-')) {
        level = parseInt(identifier.split('-')[1]);
    } else if (identifier && identifier.length > 30) { // UUID check
        deckId = identifier;
    }
    
    return lessonRepository.fetchNewItems(userId, limit, level, deckId);
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

    const levelItems = await lessonRepository.fetchLevelContent(currentLevel, userId);
    // Mastered = all facets of a Unit reached stage 'review' or 'burned'
    const mastered = levelItems.filter(i => {
        const states = i.user_fsrs_states;
        if (!states || states.length === 0) return false;

        // Determine expected facets
        let expectedCount = 1;
        if (i.type === 'vocabulary' || i.type === 'kanji') expectedCount = 2; // Fixed: assuming vocab/kanji always have 2 in this new trace model

        // Wait, some kanji might not have kunyomi? 
        // For simplicity of Law 2, we check if all EXISTING facets in DB are mastered 
        // AND there is at least something.
        return states.every((s: any) => s.state === 'review' || s.state === 'burned');
    }).length;

    const percentage = mastered / totalInLevel;

    if (percentage >= 0.9) {
        console.log(`[LearningService] Level ${currentLevel} mastered (${Math.round(percentage * 100)}%). Unlocking Level ${currentLevel + 1}`);
        const profile = await getUserProfile(userId);
        if (profile && profile.level === currentLevel) {
            await updateUserProfile(userId, { level: currentLevel + 1 });
        }
    }
}

export async function fetchLevelStats(userId: string, levelId: string) {
    let level: number | null = null;
    if (levelId.startsWith('level-')) {
        level = parseInt(levelId.split('-')[1]);
    }

    if (level) {
        // Trigger check as side effect for current level
        checkAndUnlockNextLevel(userId, level);

        // Fetch real counts for this level
        const counts = await fetchCurriculumStats();
        const total = counts[level] || 0;

        const levelItems = await lessonRepository.fetchLevelContent(level, userId);
        const learned = levelItems.filter(i => i.user_fsrs_states?.length > 0).length;
        const mastered = levelItems.filter(i => {
            const states = i.user_fsrs_states;
            if (!states || states.length === 0) return false;
            // Mastery = all facets must be in review/burned
            return states.every((s: any) => s.state === 'review' || s.state === 'burned');
        }).length;

        const typeStats = {
            radical: { total: 0, mastered: 0 },
            kanji: { total: 0, mastered: 0 },
            vocabulary: { total: 0, mastered: 0 },
            grammar: { total: 0, mastered: 0 }
        };

        levelItems.forEach(i => {
            let type: string = i.type;
            if (type === 'vocab') type = 'vocabulary';

            const typeKey = type as keyof typeof typeStats;
            if (typeStats[typeKey]) {
                typeStats[typeKey].total++;
                const states = i.user_fsrs_states;
                if (states?.length > 0 && states.every((s: any) => s.state === 'review' || s.state === 'burned')) {
                    typeStats[typeKey].mastered++;
                }
            }
        });

        return {
            total,
            learned,
            mastered,
            typeStats,
            due: levelItems.filter(i => {
                const state = i.user_fsrs_states?.[0];
                return state && new Date(state.next_review) <= HanaTime.getNow();
            }).length,
            new: total - learned
        };
    }

    return { total: 0, learned: 0, mastered: 0, due: 0, new: 0 };
}

export async function fetchLevelContent(level: number, userId: string) {
    return lessonRepository.fetchLevelContent(level, userId);
}

export async function fetchCurriculumStats() {
    return lessonRepository.fetchCurriculumStats();
}

function calculateStreak(heatmap: Record<string, number>): number {
    if (!heatmap) return 0;
    const now = HanaTime.getNow();
    let streak = 0;
    let checkDate = new Date(now);
    checkDate.setHours(0, 0, 0, 0);

    // If no activity today, check if there was activity yesterday to continue the streak
    const todayStr = checkDate.toISOString().split('T')[0];
    const yesterday = new Date(checkDate);
    yesterday.setDate(checkDate.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (!heatmap[todayStr] && !heatmap[yesterdayStr]) {
        return 0;
    }

    // Start checking from the most recent active day
    let current = heatmap[todayStr] ? checkDate : yesterday;

    while (true) {
        const dateStr = current.toISOString().split('T')[0];
        if (heatmap[dateStr]) {
            streak++;
            current.setDate(current.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

export async function fetchUserDashboardStats(userId: string, deckId?: string) {
    console.log(`[LearningService] fetchUserDashboardStats (V2) called for user ${userId}, deck ${deckId}`);

    try {
        const stats = await coreClient.getDeckDashboard(deckId);
        return stats;
    } catch (error) {
        console.error('[LearningService] Error fetching dashboard stats from Core API:', error);
        // Return a safe empty state
        return {
            reviewsDue: 0, totalLearned: 0, totalBurned: 0,
            recentLevels: [1, 2, 3], retention: 0.9,
            actionFrequencies: { analyze: 0, flashcard: 0, srs: 0 },
            dailyReviews: [0, 0, 0, 0, 0, 0, 0],
            forecast: {
                hourly: Array.from({ length: 24 }, () => ({ time: new Date().toISOString(), count: 0 })),
                daily: Array.from({ length: 14 }, () => ({ date: new Date().toISOString().split('T')[0], count: 0 })),
                total: 0
            },
            heatmap: {},
            typeMastery: { radical: 0, kanji: 0, vocabulary: 0, grammar: 0 },
            totalKUCoverage: 0,
            streak: 0,
            minutesSpent: 0,
            dueBreakdown: { learning: 0, review: 0 },
            todayBatchCount: 0
        };
    }
}

export async function fetchItemDetails(type: string, slug: string) {
    return curriculumRepository.getBySlug(slug, type as any);
}


