
/**
 * Simple FSRS-inspired scheduler.
 * (Simplified for Prototype: Intervals are in minutes for easy testing)
 */

export interface ReviewLog {
    rating: 1 | 2 | 3 | 4; // Again, Hard, Good, Easy
    reviewedAt: string;
}

export interface FSRSState {
    interval: number; // Current interval in minutes
    difficulty: number; // 0-10
    stability: number; // 0-100
    lastReview?: string;
    nextReview: string;
}

export const InitialState: FSRSState = {
    interval: 0,
    difficulty: 5,
    stability: 0,
    nextReview: new Date().toISOString() // Due immediately
};

export function calculateNextState(current: FSRSState, rating: number): FSRSState {
    const now = new Date();
    let newInterval = current.interval === 0 ? 1 : current.interval;
    let newDifficulty = current.difficulty;

    // Simplified Logic
    if (rating === 1) { // Again
        newInterval = 1; // Reset to 1 min
        newDifficulty = Math.min(10, current.difficulty + 2);
    } else if (rating === 2) { // Hard
        newInterval = Math.max(1, current.interval * 1.2);
        newDifficulty = Math.min(10, current.difficulty + 1);
    } else if (rating === 3) { // Good
        newInterval = Math.max(1, current.interval * 2.5);
    } else if (rating === 4) { // Easy
        newInterval = Math.max(1, current.interval * 4.0);
        newDifficulty = Math.max(0, current.difficulty - 1);
    }

    const nextDate = new Date(now.getTime() + newInterval * 60000); // Add minutes

    return {
        interval: Math.round(newInterval),
        difficulty: newDifficulty,
        stability: current.stability + (rating * 10), // Dummy calculation
        lastReview: now.toISOString(),
        nextReview: nextDate.toISOString()
    };
}
