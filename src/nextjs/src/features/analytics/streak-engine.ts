
/**
 * Business rules for user learning streaks.
 */

/**
 * Calculates current streak length from a list of active dates.
 * Dates assumed to be in YYYY-MM-DD format, sorted descending.
 */
export function calculateStreak(activeDates: string[], today: string = new Date().toISOString().split('T')[0]): number {
    if (activeDates.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date(today);

    // If today is not in active dates, check if yesterday was. 
    // If neither, streak is 0.
    if (!activeDates.includes(today)) {
        const yesterday = new Date(currentDate);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (!activeDates.includes(yesterdayStr)) return 0;
        currentDate = yesterday;
    }

    while (activeDates.includes(currentDate.toISOString().split('T')[0])) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
}

/**
 * Determines if a streak was maintained today.
 */
export function isStreakMaintained(activeDates: string[], today: string): boolean {
    return activeDates.includes(today);
}
