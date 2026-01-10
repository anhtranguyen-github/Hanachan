
import { flashcardService } from './flashcard-service';
import { DeckSummary } from './types';

export class DeckGroupService {

    /**
     * Returns the structured list of ALL default decks.
     */
    async getDashboardDecks(): Promise<DeckSummary[]> {
        const summaries: DeckSummary[] = [];

        // 1. System Levels (Mocking 1-3 for demo)
        for (let i = 1; i <= 3; i++) {
            summaries.push({
                id: `level-${i}`,
                title: `Level ${i}`,
                description: `JLPT N${5 - Math.floor(i / 15)} Content`,
                totalCards: 0,
                dueCards: 0,
                type: 'system_level'
            });
        }

        // 2. YouTube Pocket (Aggregated)
        const youtubeCards = await flashcardService.getCardsBySource('youtube');
        summaries.push({
            id: 'youtube-pocket',
            title: 'YouTube Pocket',
            description: 'All mining from video immersion',
            totalCards: youtubeCards.length,
            dueCards: youtubeCards.filter(c => new Date(c.next_review) <= new Date()).length,
            type: 'immersion_source'
        });

        // 3. Hana's Notebook (Chat)
        const chatCards = await flashcardService.getCardsBySource('chat');
        summaries.push({
            id: 'hana-notebook',
            title: "Hana's Notebook",
            description: 'Words learned during conversations',
            totalCards: chatCards.length,
            dueCards: chatCards.filter(c => new Date(c.next_review) <= new Date()).length,
            type: 'immersion_source'
        });

        return summaries;
    }
}

export const deckGroupService = new DeckGroupService();
