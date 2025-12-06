
import fs from 'fs';
import path from 'path';
import { FSRSState, InitialState, calculateNextState } from './fsrs-engine';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DECK_FILE = path.join(DATA_DIR, 'deck.json');

export interface Flashcard {
    id: string;
    front: string;
    back: string;
    sourceType: 'youtube' | 'chat' | 'manual';
    sourceId?: string;
    timestamp?: number;
    state: FSRSState;
    createdAt: string;
}

export class FlashcardService {
    private load(): Flashcard[] {
        if (!fs.existsSync(DECK_FILE)) return [];
        try { return JSON.parse(fs.readFileSync(DECK_FILE, 'utf-8')); }
        catch { return []; }
    }

    private save(data: Flashcard[]) {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
        fs.writeFileSync(DECK_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }

    createCard(content: { front: string; back: string; sourceType: 'youtube', sourceId?: string, timestamp?: number }) {
        const deck = this.load();
        const newCard: Flashcard = {
            id: `card-${Date.now()}`,
            ...content,
            state: { ...InitialState },
            createdAt: new Date().toISOString()
        };
        deck.push(newCard);
        this.save(deck);
        console.log(`📇 Mined Card: "${content.front.substring(0, 20)}..." (Source: ${content.sourceId} @ ${content.timestamp}s)`);
    }

    getDueCards(): Flashcard[] {
        const deck = this.load();
        const now = new Date();
        return deck.filter(c => new Date(c.state.nextReview) <= now);
    }

    submitReview(cardId: string, rating: 1 | 2 | 3 | 4) {
        const deck = this.load();
        const cardIndex = deck.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;

        console.log(`📝 Reviewed Card ${cardId} with Rating ${rating}`);
        const newState = calculateNextState(deck[cardIndex].state, rating);
        deck[cardIndex].state = newState;
        this.save(deck);
    }

    getStats() {
        const deck = this.load();
        return {
            total: deck.length,
            due: this.getDueCards().length,
            mastered: deck.filter(c => c.state.interval > 1000).length // Heuristic
        };
    }

    /**
     * Helper to view a "Virtual Deck" for a specific video or source.
     */
    getCardsBySource(sourceType: string, sourceId?: string): Flashcard[] {
        const deck = this.load();
        return deck.filter(c => {
            if (c.sourceType !== sourceType) return false;
            if (sourceId && c.sourceId !== sourceId) return false;
            return true;
        });
    }
}

export const flashcardService = new FlashcardService();
