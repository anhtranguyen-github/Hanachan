
import { MOCK_KNOWLEDGE_UNITS, MOCK_DECKS, MOCK_USER_STATES, MOCK_USER, MOCK_SENTENCES } from './seeds';
import { UserLearningState, Deck, DeckItem, KnowledgeUnit } from './types';

// In-memory store (reset on reload)
let users = [MOCK_USER];
let decks = [...MOCK_DECKS];
let kus = [...MOCK_KNOWLEDGE_UNITS];
let userStates = [...MOCK_USER_STATES];
let sentences = [...MOCK_SENTENCES];

// Simulate delays to make it feel "real"
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const MockDB = {
    // --- Decks ---
    async getUserDecks(userId: string): Promise<Deck[]> {
        await delay(100);
        return decks.filter(d => d.owner_id === userId || d.deck_type === 'system');
    },

    async createDeck(deck: Partial<Deck>): Promise<Deck> {
        await delay(200);
        const newDeck: Deck = {
            id: `deck-${Math.random().toString(36).substr(2, 9)}`,
            owner_id: deck.owner_id || null,
            name: deck.name || 'Untitled',
            description: deck.description || null,
            deck_type: deck.deck_type || 'user',
            level: deck.level || null,
            created_at: new Date().toISOString()
        };
        decks.push(newDeck);
        return newDeck;
    },

    async getDeckItems(deckId: string): Promise<any[]> {
        await delay(100);
        // For system decks, return all items of that level
        const deck = decks.find(d => d.id === deckId);
        if (deck && deck.level) {
            return kus.filter(k => k.level === deck.level).map(k => ({
                id: `item-${k.id}`,
                deck_id: deckId,
                ku_id: k.id,
                created_at: new Date().toISOString(),
                knowledge_units: k
            }));
        }
        return []; // User decks not implemented in seeds yet
    },

    async getDeckMasteryStats(userId: string, deckId: string) {
        // Mock implementation
        const deckItems = await this.getDeckItems(deckId);
        const states = userStates.filter(s => s.user_id === userId);

        // Join
        const itemStates = deckItems.map(item => {
            return states.find(s => s.ku_id === item.ku_id);
        });

        const learned = itemStates.filter(s => s && s.state !== 'new').length;
        const burned = itemStates.filter(s => s && s.state === 'burned').length;

        return { total: deckItems.length, learned, burned };
    },

    // --- SRS ---
    async fetchDueItems(userId: string) {
        await delay(100);
        const now = new Date();
        const due = userStates.filter(s => s.user_id === userId && new Date(s.next_review || '') <= now);

        // Join with KUs
        return due.map(s => {
            const ku = kus.find(k => k.id === s.ku_id);
            return {
                ...s,
                knowledge_units: ku
            };
        }).filter(item => item.knowledge_units);
    },

    async fetchNewItems(userId: string, limit: number, level?: number) {
        await delay(100);
        // Find KUs not in userStates
        const learnedIds = new Set(userStates.filter(s => s.user_id === userId).map(s => s.ku_id));

        let candidates = kus.filter(k => !learnedIds.has(k.id));
        if (level) {
            candidates = candidates.filter(k => k.level === level);
        }

        return candidates.slice(0, limit).map(ku => ({
            user_id: userId,
            ku_id: ku.id,
            state: 'new',
            knowledge_units: ku,
            // Add default state props for UI compatibility
            srs_stage: 0,
            next_review: null
        }));
    },

    async fetchLevelContent(level: number, userId: string) {
        await delay(100);
        const levelKus = kus.filter(k => k.level === level);
        return levelKus.map(ku => {
            const state = userStates.find(s => s.user_id === userId && s.ku_id === ku.id);
            return {
                ...ku,
                user_learning_states: state ? [state] : []
            };
        });
    },

    async fetchCurriculumStats() {
        await delay(100);
        const counts: Record<number, number> = {};
        kus.forEach(k => {
            if (k.level) {
                counts[k.level] = (counts[k.level] || 0) + 1;
            }
        });
        // Default seed might be small, so maybe merge with some static base if we want "wow" stats
        return counts;
    },

    async fetchUserDashboardStats(userId: string) {
        await delay(100);
        const learnedCount = userStates.filter(s => s.user_id === userId).length;
        const dueCount = userStates.filter(s => s.user_id === userId && new Date(s.next_review || '') <= new Date()).length;

        // Recent levels?
        const practicedKus = userStates.filter(s => s.user_id === userId).map(s => s.ku_id);
        const levels = new Set<number>();
        practicedKus.forEach(id => {
            const k = kus.find(u => u.id === id);
            if (k && k.level) levels.add(k.level);
        });

        return {
            reviewsDue: dueCount,
            totalLearned: learnedCount,
            streak: 3, // hardcoded for now
            recentLevels: Array.from(levels).sort().slice(0, 3)
        };
    },

    async searchKnowledgeUnits(query: string): Promise<KnowledgeUnit[]> {
        await delay(100);
        const lowerQ = query.toLowerCase();
        return kus.filter(k =>
            k.slug.toLowerCase().includes(lowerQ) ||
            (k.character && k.character.includes(query)) ||
            (k.meaning && k.meaning.toLowerCase().includes(lowerQ))
        );
    },

    async fetchItemDetails(type: string, slug: string) {
        // slug might need decoding or matching
        // In mock, ID is slug usually.
        // Try to find by slug first
        const item = kus.find(k => k.slug.includes(slug) || k.id === slug); // Loose match
        console.log(`MockDB: fetching item ${slug} -> found: ${item?.id}`);
        if (item) {
            const state = userStates.find(s => s.ku_id === item.id);
            return {
                ...item,
                user_learning_states: state,
                ku_kanji: item.ku_kanji,
                ku_vocabulary: item.ku_vocabulary,
                ku_radicals: item.ku_radicals
            };
        }
        return null;
    },

    // --- Updates ---
    async updateUserState(userId: string, kuId: string, updates: Partial<UserLearningState>) {
        await delay(50);
        const idx = userStates.findIndex(s => s.user_id === userId && s.ku_id === kuId);
        if (idx >= 0) {
            userStates[idx] = { ...userStates[idx], ...updates };
        } else {
            // New state
            userStates.push({
                user_id: userId,
                ku_id: kuId,
                state: 'learning',
                stability: 0,
                difficulty: 0,
                lapses: 0,
                reps: 0,
                last_review: new Date().toISOString(),
                next_review: updates.next_review || new Date().toISOString(),
                ...updates
            } as UserLearningState);
        }
    }
};
