
import { describe, it, expect } from 'vitest';
import { isSystemDeck, canModifyDeck } from '../../src/features/decks/deck-logic';

describe('Deck Logic', () => {
    it('should identify system decks correctly', () => {
        const systemDeck = { id: '1', name: 'N5', type: 'system' };
        expect(isSystemDeck(systemDeck as any)).toBe(true);
        
        const userDeck = { id: '2', name: 'Mine', type: 'user_mined', user_id: 'u1' };
        expect(isSystemDeck(userDeck as any)).toBe(false);
    });

    it('should validate deck ownership', () => {
        const userDeck = { id: '2', name: 'Mine', type: 'user_mined', user_id: 'u1' };
        expect(canModifyDeck(userDeck as any, 'u1')).toBe(true);
        expect(canModifyDeck(userDeck as any, 'u2')).toBe(false);
    });
});
