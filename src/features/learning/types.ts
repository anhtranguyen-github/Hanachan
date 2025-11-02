
export type SRSState = 'New' | 'Learning' | 'Review' | 'Relearning' | 'Burned';

export interface FSRSParameters {
    stability: number;
    difficulty: number;
    elapsed_days: number;
    scheduled_days: number;
    state: SRSState;
    last_review?: Date;
    lapses: number;
    reps: number;
}

export type ReviewRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy

export interface FSRSReviewResult {
    next_state: SRSState;
    next_stability: number;
    next_difficulty: number;
    scheduled_days: number;
    next_review: Date;
}

export interface ReviewSubmission {
    ku_id: string;
    rating: ReviewRating;
    review_at: Date;
}
