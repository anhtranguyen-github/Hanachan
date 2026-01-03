
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Domain Models ---

export interface Deck {
    id: string;
    title: string;
    description: string;
    createdAt: string;
}

export interface Card {
    id: string;
    deckId: string;
    front: string;
    back: string;
    status: 'new' | 'learning' | 'review' | 'graduated';
    interval: number; // days
    easeFactor: number;
    dueDate: number; // timestamp
}

export interface ReviewLog {
    id: string;
    cardId: string;
    grade: 'again' | 'hard' | 'good' | 'easy';
    reviewedAt: string;
}

// --- Store State ---

interface DataState {
    decks: Deck[];
    cards: Card[];
    logs: ReviewLog[];

    // Actions
    addDeck: (title: string, description: string) => void;
    deleteDeck: (id: string) => void;
    updateDeck: (id: string, updates: Partial<Deck>) => void;

    addCard: (deckId: string, front: string, back: string) => void;
    deleteCard: (id: string) => void;
    updateCard: (id: string, updates: Partial<Card>) => void;

    // Study Logic
    getDueCards: (deckId: string) => Card[];
    submitReview: (cardId: string, grade: 'again' | 'hard' | 'good' | 'easy') => void;

    // Debug/Dev
    resetData: () => void;
}

// --- Initial Seed Data ---
const SEED_DECKS: Deck[] = [
    { id: 'deck-1', title: 'Hiragana Basic', description: 'Essential hiragana characters', createdAt: new Date().toISOString() },
    { id: 'deck-2', title: 'JLPT N5 Vocab', description: 'Core vocabulary for beginners', createdAt: new Date().toISOString() }
];

const SEED_CARDS: Card[] = [
    { id: 'card-1', deckId: 'deck-1', front: 'あ', back: 'a', status: 'new', interval: 0, easeFactor: 2.5, dueDate: Date.now() },
    { id: 'card-2', deckId: 'deck-1', front: 'い', back: 'i', status: 'new', interval: 0, easeFactor: 2.5, dueDate: Date.now() },
    { id: 'card-3', deckId: 'deck-2', front: '猫', back: 'Cat (Neko)', status: 'learning', interval: 1, easeFactor: 2.5, dueDate: Date.now() - 10000 },
];

export const useMockDataStore = create<DataState>()(
    persist(
        (set, get) => ({
            decks: SEED_DECKS,
            cards: SEED_CARDS,
            logs: [],

            addDeck: (title, description) => set((state) => ({
                decks: [
                    ...state.decks,
                    {
                        id: `deck-${Date.now()}`,
                        title,
                        description,
                        createdAt: new Date().toISOString()
                    }
                ]
            })),

            deleteDeck: (id) => set((state) => ({
                decks: state.decks.filter((d) => d.id !== id),
                cards: state.cards.filter((c) => c.deckId !== id) // Cascade delete
            })),

            updateDeck: (id, updates) => set((state) => ({
                decks: state.decks.map((d) => d.id === id ? { ...d, ...updates } : d)
            })),

            addCard: (deckId, front, back) => set((state) => ({
                cards: [
                    ...state.cards,
                    {
                        id: `card-${Date.now()}`,
                        deckId,
                        front,
                        back,
                        status: 'new',
                        interval: 0,
                        easeFactor: 2.5,
                        dueDate: Date.now()
                    }
                ]
            })),

            deleteCard: (id) => set((state) => ({
                cards: state.cards.filter((c) => c.id !== id)
            })),

            updateCard: (id, updates) => set((state) => ({
                cards: state.cards.map((c) => c.id === id ? { ...c, ...updates } : c)
            })),

            getDueCards: (deckId) => {
                const now = Date.now();
                return get().cards.filter(c => c.deckId === deckId && c.dueDate <= now);
            },

            submitReview: (cardId, grade) => set((state) => {
                const card = state.cards.find(c => c.id === cardId);
                if (!card) return {};

                // Very simple mock SRS logic
                let newInterval = card.interval;
                let newEase = card.easeFactor;
                let newStatus = card.status;

                if (grade === 'again') {
                    newInterval = 0;
                    newStatus = 'learning';
                } else if (grade === 'hard') {
                    newInterval = Math.max(1, newInterval * 1.2);
                    newEase = Math.max(1.3, newEase - 0.15);
                } else if (grade === 'good') {
                    newInterval = newInterval === 0 ? 1 : newInterval * newEase;
                    newStatus = 'review';
                } else if (grade === 'easy') {
                    newInterval = newInterval === 0 ? 4 : newInterval * newEase * 1.3;
                    newEase += 0.15;
                    newStatus = 'graduated';
                }

                // Add random noise to avoid pileups in mock
                newInterval = Math.ceil(newInterval);

                const nextDue = Date.now() + (newInterval * 24 * 60 * 60 * 1000);

                return {
                    cards: state.cards.map(c => c.id === cardId ? {
                        ...c,
                        status: newStatus,
                        interval: newInterval,
                        easeFactor: newEase,
                        dueDate: nextDue
                    } : c),
                    logs: [
                        ...state.logs,
                        {
                            id: `log-${Date.now()}`,
                            cardId,
                            grade,
                            reviewedAt: new Date().toISOString()
                        }
                    ]
                };
            }),

            resetData: () => set({ decks: SEED_DECKS, cards: SEED_CARDS, logs: [] })
        }),
        {
            name: 'hanachan-mock-data-storage', // Key for localStorage
        }
    )
);
