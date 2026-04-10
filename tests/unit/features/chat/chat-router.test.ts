import { describe, it, expect } from 'vitest';
import { classifyIntent } from '@/features/chat/chat-router';

describe('ChatRouter Intent Classification', () => {
    it('should classify greetings correctly', () => {
        expect(classifyIntent('Hello Hanachan!')).toBe('GREETING');
        expect(classifyIntent('konnichiwa')).toBe('GREETING');
        expect(classifyIntent('yo')).toBe('GREETING');
    });

    it('should classify Japanese text as ANALYZE (not SEARCH_KU)', () => {
        // The router returns ANALYZE for Japanese text (no SEARCH_KU keyword routing)
        expect(classifyIntent('search for 食べる')).toBe('ANALYZE');
        expect(classifyIntent('食べる là gì?')).toBe('ANALYZE');
        expect(classifyIntent('lookup 先生')).toBe('ANALYZE');
    });

    it('should classify project queries correctly', () => {
        expect(classifyIntent('tell me about the project architecture')).toBe('PROJECT_QUERY');
        expect(classifyIntent('what is the stack of this app?')).toBe('PROJECT_QUERY');
    });

    it('should fallback to GENERAL_CHAT', () => {
        expect(classifyIntent('I love learning Japanese')).toBe('GENERAL_CHAT');
        expect(classifyIntent('What time is it?')).toBe('GENERAL_CHAT');
        // English-only search query (no Japanese) → GENERAL_CHAT
        expect(classifyIntent('find Kanji for water')).toBe('GENERAL_CHAT');
    });
});
