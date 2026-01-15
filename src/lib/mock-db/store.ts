
import { MOCK_KNOWLEDGE_UNITS, MOCK_DECKS, MOCK_USER_STATES, MOCK_USER, MOCK_SENTENCES, MOCK_YOUTUBE_VIDEOS, MOCK_CHATS } from './seeds';
import { UserLearningState, Deck, DeckItem, KnowledgeUnit, YouTubeVideo, ChatSession } from './types';

// In-memory store (reset on reload)
let users = [MOCK_USER];
let decks = [...MOCK_DECKS];
let kus = [...MOCK_KNOWLEDGE_UNITS];
let userStates = [...MOCK_USER_STATES];
let sentences = [...MOCK_SENTENCES];
let ytVideos = [...MOCK_YOUTUBE_VIDEOS];
let chats = [...MOCK_CHATS];

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
        const deck = decks.find(d => d.id === deckId);
        if (!deck) return [];

        if (deck.deck_type === 'system') {
            // Filter by level and potentially by name hints (e.g. "Kanji")
            let filtered = kus.filter(k => k.level === deck.level);
            if (deck.name.toLowerCase().includes('kanji')) {
                filtered = filtered.filter(k => k.type === 'kanji');
            } else if (deck.name.toLowerCase().includes('vocabulary')) {
                filtered = filtered.filter(k => k.type === 'vocabulary');
            } else if (deck.name.toLowerCase().includes('grammar')) {
                filtered = filtered.filter(k => k.type === 'grammar');
            }

            return filtered.map(k => ({
                id: `item-${k.id}`,
                deck_id: deckId,
                ku_id: k.id,
                knowledge_units: k
            }));
        }

        // For user decks, return mined words (stubbed)
        if (deck.deck_type === 'user') {
            return kus.slice(0, 5).map(k => ({
                id: `item-${k.id}`,
                deck_id: deckId,
                ku_id: k.id,
                knowledge_units: k
            }));
        }

        return [];
    },

    async getDeckProgress(userId: string, deckId: string) {
        await delay(50);
        const deckItems = await this.getDeckItems(deckId);
        const states = userStates.filter(s => s.user_id === userId);
        const now = new Date();

        let newCards = 0;
        let learningCount = 0;
        let reviewCount = 0;
        let due = 0;
        let burnedCount = 0;

        deckItems.forEach(item => {
            const state = states.find(s => s.ku_id === item.ku_id);
            if (!state || state.state === 'new') {
                newCards++;
            } else {
                if (state.state === 'learning' || state.state === 'relearning') learningCount++;
                if (state.state === 'review') reviewCount++;
                if (state.state === 'burned') burnedCount++;

                if (state.next_review && new Date(state.next_review) <= now) {
                    due++;
                }
            }
        });

        const total = deckItems.length;
        const coverage = total > 0 ? ((total - newCards) / total) * 100 : 0;

        return {
            total,
            due,
            new: newCards,
            learning: learningCount,
            burned: burnedCount,
            coverage: Math.round(coverage),
            composition: { radical: 10, kanji: 40, vocab: 50 },
            masteryLevels: [1, 2, 2, 3, 1, 4, 2],
            flashcardTypes: { radical: 5, kanji: 15, vocab: 25, cloze: 10 },
            sentenceCoverage: { primary: 80, secondary: 20 }
        };
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
        const states = userStates.filter(s => s.user_id === userId);
        const learnedCount = states.length;
        const dueCount = states.filter(s => new Date(s.next_review || '') <= new Date()).length;

        // Forecast data for the next 7 days
        const forecast = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);
            date.setHours(23, 59, 59, 999);
            const count = states.filter(s => {
                const due = new Date(s.next_review || '');
                return due <= date && (i === 0 || due > new Date(new Date().setDate(new Date().getDate() + i - 1)));
            }).length;
            return { day: i, count: count + (i === 0 ? 0 : Math.floor(Math.random() * 10)) }; // Adding some mock variance
        });

        // Retention data (mock)
        const retention = [98, 97, 95, 96, 94, 95, 97];

        const practicedKus = states.map(s => s.ku_id);
        const levels = new Set<number>();
        practicedKus.forEach(id => {
            const k = kus.find(u => u.id === id);
            if (k && k.level) levels.add(k.level);
        });

        return {
            reviewsDue: dueCount,
            totalLearned: learnedCount,
            recentLevels: Array.from(levels).sort().slice(0, 3),
            forecast,
            retention: 0.94,
            stabilityDist: { low: 20, med: 50, high: 30 },
            difficultyDist: { easy: 40, med: 45, hard: 15 },
            dailyReviews: [12, 45, 30, 55, 40, 60, 42],
            newLearned: [5, 10, 8, 12, 5, 15, 7],
            typeMastery: { radical: 95, kanji: 65, vocab: 45, grammar: 30 },
            totalBurned: states.filter(s => s.state === 'burned').length,
            heatmap: Array.from({ length: 52 * 7 }, () => Math.floor(Math.random() * 5)),
            totalKUCoverage: (learnedCount / kus.length) * 100,
            actionFrequencies: { analyze: 120, flashcard: 450, srs: 800 }
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
    },

    // --- YouTube ---
    async getYouTubeVideos(): Promise<YouTubeVideo[]> {
        await delay(100);
        return ytVideos;
    },

    async getYouTubeVideo(id: string): Promise<YouTubeVideo | null> {
        await delay(100);
        return ytVideos.find(v => v.id === id || v.video_id === id) || null;
    },

    async createYouTubeVideo(userId: string, videoId: string, title: string): Promise<YouTubeVideo> {
        await delay(200);
        const newVideo: YouTubeVideo = {
            id: `yt-${Math.random().toString(36).substr(2, 9)}`,
            video_id: videoId,
            title: title || 'New YouTube Video',
            channel: 'YouTube Creator',
            duration: 0,
            created_by: userId,
            created_at: new Date().toISOString()
        };
        ytVideos.unshift(newVideo);
        return newVideo;
    },

    // --- Chat ---
    async getChatSessions(userId: string): Promise<ChatSession[]> {
        await delay(100);
        return chats.filter(c => c.user_id === userId);
    },

    async getChatSession(id: string): Promise<ChatSession | null> {
        await delay(100);
        return chats.find(c => c.id === id) || null;
    },

    async createChatSession(userId: string, title: string): Promise<ChatSession> {
        await delay(200);
        const newSession: ChatSession = {
            id: `chat-${Math.random().toString(36).substr(2, 9)}`,
            user_id: userId,
            title: title || 'New Conversation',
            mode: 'chat',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            messages: []
        };
        chats.unshift(newSession);
        return newSession;
    },

    async addChatMessage(sessionId: string, message: any) {
        await delay(100);
        const chat = chats.find(c => c.id === sessionId);
        if (chat) {
            chat.messages.push({
                ...message,
                timestamp: new Date().toISOString()
            });
            chat.updated_at = new Date().toISOString();
            return chat;
        }
    },

    // --- Sentences ---
    async getAllSentences(): Promise<Sentence[]> {
        await delay(100);
        return sentences;
    },
    async getSentence(id: string): Promise<Sentence | null> {
        await delay(100);
        return sentences.find(s => s.id === id) || null;
    },

    async createSentence(data: Partial<Sentence>): Promise<Sentence> {
        await delay(200);
        const newSentence: Sentence = {
            id: `s-${Math.random().toString(36).substr(2, 9)}`,
            text_ja: data.text_ja || '',
            text_en: data.text_en || '',
            origin: data.origin || 'user',
            source_text: data.source_text || null,
            metadata: data.metadata || {},
            created_by: data.created_by || null,
            created_at: new Date().toISOString()
        };
        sentences.unshift(newSentence);
        return newSentence;
    },

    async updateSentence(id: string, data: Partial<Sentence>): Promise<Sentence | null> {
        await delay(200);
        const index = sentences.findIndex(s => s.id === id);
        if (index === -1) return null;
        sentences[index] = { ...sentences[index], ...data };
        return sentences[index];
    },

};
