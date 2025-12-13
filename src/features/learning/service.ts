
import { kuRepository } from '../knowledge/db';
import { analyticsService } from '../analytics/service';
import * as db from './db';
import { FSRSAlgorithm } from './srs-algorithm';
import { SRSCard } from './srs-card';
import { StudySession } from './study-session';
import { ReviewRating, FSRSReviewResult } from './types';

export class LearningService {
    /**
     * Initializes a study session for the user.
     * Fetches all due and new cards.
     */
    async startSession(userId: string): Promise<StudySession> {
        // 1. Fetch due learning states from DB
        // We use a reasonably large limit or no limit since we removed boundaries
        const dueData = await db.getDueCards(userId, 100);

        const cards = dueData.map((item: any) => new SRSCard(item.ku_id, {
            stability: item.stability,
            difficulty: item.difficulty,
            elapsed_days: item.elapsed_days,
            scheduled_days: item.scheduled_days,
            state: item.state,
            last_review: item.last_review ? new Date(item.last_review) : undefined,
            reps: item.reps,
            lapses: item.lapses
        }));

        return new StudySession(cards);
    }

    /**
     * Submits a single card review.
     * Updates DB learning state, logs history, and increments analytics.
     */
    async submitReview(
        userId: string,
        kuId: string,
        rating: ReviewRating
    ): Promise<FSRSReviewResult> {
        // 1. Get current state
        const states = await db.getUserLearningStates(userId);
        const currentState = states[kuId];

        const card = new SRSCard(kuId, currentState ? {
            stability: currentState.stability,
            difficulty: currentState.difficulty,
            state: currentState.state as any,
            last_review: currentState.last_review ? new Date(currentState.last_review) : undefined,
            reps: currentState.reps,
            lapses: currentState.lapses
        } : undefined);

        // 2. Calculate next state
        const settings = await db.getLearningSettings(userId);
        const algo = new FSRSAlgorithm(settings.weights as number[], settings.targetRetention);

        const isNew = card.state === 'New';
        const result = card.review(rating, algo);
        const snapshot = card.snapshot;

        // 3. Persist changes
        await db.updateLearningState(
            userId,
            kuId,
            result,
            snapshot.reps,
            snapshot.lapses
        );

        // 4. Log history for charts
        await db.logReviewHistory(userId, kuId, rating, snapshot, result);

        // 5. Track stats
        await analyticsService.trackReview(userId, isNew);

        return result;
    }
}

export const learningService = new LearningService();
