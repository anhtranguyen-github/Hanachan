
import { flashcardService, Flashcard } from './flashcard-service';

export interface DeckSummary {
    id: string; // 'level-1', 'youtube', 'chat'
    title: string;
    description: string;
    totalCards: number;
    dueCards: number;
    type: 'system_level' | 'immersion_source';
}

export class DeckGroupService {

    /**
     * Returns the structured list of ALL default decks.
     */
    getDashboardDecks(): DeckSummary[] {
        const summaries: DeckSummary[] = [];

        // 1. System Levels (Mocking 1-3 for demo, but logically 1-60)
        for (let i = 1; i <= 3; i++) {
            summaries.push({
                id: `level-${i}`,
                title: `Level ${i}`,
                description: `JLPT N${5 - Math.floor(i / 15)} Content`,
                totalCards: 0, // In real app, query KB service
                dueCards: 0, // System decks usually act as content sources, not mined piles
                type: 'system_level'
            });
        }

        // 2. YouTube Pocket (Aggregated)
        const youtubeCards = flashcardService.getCardsBySource('youtube');
        summaries.push({
            id: 'youtube-pocket',
            title: 'YouTube Pocket',
            description: 'All mining from video immersion',
            totalCards: youtubeCards.length,
            dueCards: youtubeCards.filter(c => new Date(c.state.nextReview) <= new Date()).length,
            type: 'immersion_source'
        });

        // 3. Hana's Notebook (Chat)
        const chatCards = flashcardService.getCardsBySource('chat');
        summaries.push({
            id: 'hana-notebook',
            title: "Hana's Notebook",
            description: 'Words learned during conversations',
            totalCards: chatCards.length,
            dueCards: chatCards.filter(c => new Date(c.state.nextReview) <= new Date()).length,
            type: 'immersion_source'
        });

        return summaries;
    }
}

export const deckGroupService = new DeckGroupService();
