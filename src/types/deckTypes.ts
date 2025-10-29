export interface CustomDeck {
    id: string;
    name: string;
    description?: string;
    itemIds: string[]; // List of grammar/vocab point IDs
    color?: string;
    isDefault?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface DeckItem {
    id: string;
    type: 'grammar' | 'vocab' | 'kanji';
    title: string;
    reading?: string;
    meaning: string;
    srsLevel: number;
    nextReview?: string;
    mnemonic?: string;
}

export interface DeckState {
    decks: CustomDeck[];
    defaultDeckId?: string;
}
