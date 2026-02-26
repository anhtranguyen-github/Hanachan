import { describe, it, expect } from 'vitest';
import { classifyIntent } from '@/features/chat/chat-router';

describe('ChatRouter Intent Classification', () => {
    it('should classify greetings correctly', () => {
        expect(classifyIntent('Hello Hanachan!')).toBe('GREETING');
        expect(classifyIntent('konnichiwa')).toBe('GREETING');
        expect(classifyIntent('yo')).toBe('GREETING');
    });

    it('should classify search queries correctly', () => {
        expect(classifyIntent('search for 食べる')).toBe('SEARCH_KU');
        expect(classifyIntent('find Kanji for water')).toBe('SEARCH_KU');
        expect(classifyIntent('食べる là gì?')).toBe('SEARCH_KU');
        expect(classifyIntent('lookup 先生')).toBe('SEARCH_KU');
    });

    it('should classify project queries correctly', () => {
        expect(classifyIntent('tell me about the project architecture')).toBe('PROJECT_QUERY');
        expect(classifyIntent('what is the stack of this app?')).toBe('PROJECT_QUERY');
    });

    it('should fallback to GENERAL_CHAT', () => {
        expect(classifyIntent('I love learning Japanese')).toBe('GENERAL_CHAT');
        expect(classifyIntent('What time is it?')).toBe('GENERAL_CHAT');
    });
});
