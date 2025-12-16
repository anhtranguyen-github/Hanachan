
export interface DailyStats {
    user_id: string;
    day: string; // YYYY-MM-DD
    minutes_spent: number;
    reviews_completed: number;
    new_cards_learned: number;
    correct_reviews: number;
}

export interface DashboardStats {
    daily: {
        minutes: number;
        reviews: number;
        retention: number;
    };
    learning?: {
        totalCards: number;
        dueToday: number;
        mastered: number;
    };
}
