export interface DailyStats {
    user_id: string;
    day: string; // ISO date YYYY-MM-DD
    new_cards_learned: number;
    cards_reviewed: number;
    minutes_spent: number;
    success_rate?: number | null;
}
