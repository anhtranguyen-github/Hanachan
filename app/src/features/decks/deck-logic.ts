
import { Deck, DeckItem } from './types';

export function isSystemDeck(deck: Deck): boolean {
    return deck.deck_type === 'system' || !deck.owner_id;
}

export function canModifyDeck(deck: Deck, userId: string): boolean {
    return deck.owner_id === userId;
}

export function validateDeckItem(item: DeckItem): boolean {
    return !!(item.deck_id && item.ku_id);
}

/**
 * Business Rule: System decks have priority in 60-level standard curriculum.
 */
export function getDeckPriority(deck: Deck): number {
    if (isSystemDeck(deck)) return 100;
    return 10;
}
