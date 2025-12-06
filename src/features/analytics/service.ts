
import fs from 'fs';
import path from 'path';
import { flashcardService } from '../deck/flashcard-service';
import { videoLibraryService } from '../library/video-library';

export class AnalyticsService {

    getDashboardStats() {
        const deckStats = flashcardService.getStats();
        const library = videoLibraryService.listVideos();

        const totalProgress = library.reduce((sum, v) => sum + v.progress, 0);
        const avgProgress = library.length > 0 ? Math.round(totalProgress / library.length) : 0;

        return {
            learning: {
                totalCards: deckStats.total,
                dueToday: deckStats.due,
                mastered: deckStats.mastered
            },
            library: {
                totalVideos: library.length,
                completedVideos: library.filter(v => v.status === 'completed').length,
                avgProgress: avgProgress
            },
            streak: 5, // Mock data for now
            lastActivity: new Date().toISOString()
        };
    }
}

export const analyticsService = new AnalyticsService();
