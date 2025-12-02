
import { describe, it, expect } from 'vitest';
import { classifyIntent } from '../../src/features/chat/chat-router';
import { buildEnrichedContext } from '../../src/features/chat/context-enabler';

describe('Chat Router', () => {
    it('should classify analysis requests', () => {
        expect(classifyIntent('Please analyze this sentence')).toBe('SENTENCE_ANALYSIS');
        expect(classifyIntent('Phân tích câu này')).toBe('SENTENCE_ANALYSIS');
    });

    it('should default to general query', () => {
        expect(classifyIntent('Hello Hana!')).toBe('GENERAL_QUERY');
    });
});

describe('Context Enabler', () => {
    it('should inject learning context into system prompt', () => {
        const learning = {
            currentLevel: 5,
            troubleItems: ['ku_123'],
            dueCount: 10,
            recentMistakes: []
        };
        const context = buildEnrichedContext([], learning);
        // Using regex to be safe about white space/newlines
        expect(context.systemPrompt).toMatch(/level:?\s*5/i);
        expect(context.systemPrompt).toMatch(/ku_123/);
    });
});
