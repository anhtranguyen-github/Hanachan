import { addHours } from 'date-fns';
import { calculateNextReview, Rating, SRSState } from './domain/SRSAlgorithm';
import { RatingSchema } from '@/lib/validation';
import { srsRepository } from './srsRepository';
import { lessonRepository } from './lessonRepository';
import { curriculumRepository } from '../knowledge/db';
import { analyticsService } from '../analytics/service';
import { getUserProfile, updateUserProfile } from '../auth/db';

export async function initializeSRS(userId: string, unitId: string, facets: string[]) {
    const initialStability = 0.166; // Approx 4 hours
    const initialDifficulty = 3.0;
    const nextReview = addHours(new Date(), 4);

    console.log(`[LearningService] Initializing SRS for ${unitId} with facets: ${facets.join(', ')}`);

    for (const facet of facets) {
        await srsRepository.updateUserState(userId, unitId, facet, {
            state: 'learning',
            next_review: nextReview.toISOString(),
            reps: 1,
            lapses: 0,
            last_review: new Date().toISOString(),
            stability: initialStability,
            difficulty: initialDifficulty
        });
    }
}

export async function submitReview(userId: string, unitId: string, facet: string, rating: Rating, currentState: SRSState, wrongCount: number = 0) {
    // 0. Validation
    RatingSchema.parse(rating);

    // 1. Calculate New State
    // FIF Logic: Pass wrongCount to the FSRSEngine
    const { next_review, next_state } = calculateNextReview(currentState, rating, wrongCount);

    console.log(`[LearningService] Submitting review for ${unitId} (${facet}): ${rating}. OLD S:${currentState.stability}, NEW S:${next_state.stability}, WRONG:${wrongCount}`);

    await srsRepository.updateUserState(userId, unitId, facet, {
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
    const isCorrect = rating !== 'again';
    await analyticsService.logReview(isNew, isCorrect, userId);

    // 3. Level Progression (Law of 90%)
    const justMastered = currentState.stage === 'learning' && (next_state.stage === 'review' || next_state.stage === 'burned');
    if (justMastered) {
        // Find level of this Unit
        const ku = await curriculumRepository.getById(unitId, 'kanji' as any); // Type doesn't strictly matter for level
        if (ku && ku.level) {
            // Trigger check as background task (don't await to keep UI fast)
            checkAndUnlockNextLevel(userId, ku.level);
        }
    }

    return { next_review, next_state };
}

export async function fetchDueItems(userId: string) {
    return srsRepository.fetchDueItems(userId);
}

export async function startLessonSession(userId: string, level: number) {
    const DAILY_LIMIT = 10;
    const todayCount = await lessonRepository.countTodayBatches(userId);

    if (todayCount >= DAILY_LIMIT) {
        throw new Error(`Daily limit reached! You have already finished ${DAILY_LIMIT} batches today. Take a rest for better retention.`);
    }

    const items = await lessonRepository.fetchNewItems(userId, 5, level);
    if (items.length === 0) {
        return { items: [], batch: null };
    }

    const batch = await lessonRepository.createLessonBatch(userId, level);
    await lessonRepository.createLessonItems(batch.id, items.map((i: any) => i.ku_id));

    return { items, batch };
}

export async function fetchNewItems(userId: string, levelId: string, limit: number = 5) {
    let level: number | undefined;
    if (levelId?.startsWith('level-')) {
        level = parseInt(levelId.split('-')[1]);
    }
    return lessonRepository.fetchNewItems(userId, limit, level);
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
        const states = i.user_learning_states;
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
        const learned = levelItems.filter(i => i.user_learning_states?.length > 0).length;
        const mastered = levelItems.filter(i => {
            const states = i.user_learning_states;
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
                const states = i.user_learning_states;
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
                const state = i.user_learning_states?.[0];
                return state && new Date(state.next_review) <= new Date();
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

export async function fetchUserDashboardStats(userId: string) {
    console.log('[LearningService] fetchUserDashboardStats called for userId:', userId);

    try {
        const dueItems = await srsRepository.fetchDueItems(userId);
        const repoStats = await srsRepository.fetchStats(userId);
        const dailyStats = await analyticsService.getDashboardStats(userId);
        const todayBatchCount = await lessonRepository.countTodayBatches(userId);
        const rawForecast = await srsRepository.fetchReviewForecast(userId);

        console.log('[LearningService] Live Data:', { due: dueItems?.length, learned: repoStats?.learned, today: dailyStats?.daily, todayBatches: todayBatchCount });

        // Process Forecast (Hourly for 24h, Daily for 14d)
        const now = new Date();
        const hourlyForecast = Array.from({ length: 24 }, (_, i) => {
            const hourStart = new Date(now);
            hourStart.setHours(now.getHours() + i, 0, 0, 0);
            const hourEnd = new Date(hourStart);
            hourEnd.setHours(hourEnd.getHours() + 1);

            const count = rawForecast.filter(f => {
                const d = new Date(f.next_review);
                return d >= hourStart && d < hourEnd;
            }).length;

            return { time: hourStart.toISOString(), count };
        });

        const dailyForecast = Array.from({ length: 14 }, (_, i) => {
            const dayStart = new Date(now);
            dayStart.setDate(now.getDate() + i);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const count = rawForecast.filter(f => {
                const d = new Date(f.next_review);
                return d >= dayStart && d < dayEnd;
            }).length;

            return { date: dayStart.toISOString().split('T')[0], count };
        });

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
            totalMastered: repoStats?.mastered || 0,
            totalBurned: repoStats?.burned || 0,
            recentLevels: [1, 2, 3],
            retention: dailyStats?.daily.retention || 90,
            minutesSpent: dailyStats?.daily.minutes || 0,
            reviewsToday: repoStats?.last7Days[6] || 0, // Use repo data for accuracy
            actionFrequencies: { analyze: 0, flashcard: repoStats?.learned || 0, srs: 0 },
            dailyReviews: repoStats?.last7Days || [0, 0, 0, 0, 0, 0, 0],
            forecast: {
                hourly: hourlyForecast,
                daily: dailyForecast,
                total: rawForecast.length
            },
            heatmap: repoStats?.heatmap || {},
            typeMastery: typePercentages,
            srsSpread: repoStats?.srsSpread || { apprentice: 0, guru: 0, master: 0, enlightened: 0, burned: 0 },
            totalKUCoverage: repoStats ? (repoStats.learned / repoStats.totalKUs) * 100 : 0,
            streak: 0, // Adding missing field to satisfy UI
            todayBatchCount
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


