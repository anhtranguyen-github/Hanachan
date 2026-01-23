
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeSentence } from '@/features/mining/domain/analyzer';

// Mock LangChain OpenAI
vi.mock('@langchain/openai', () => {
    class ChatOpenAI {
        pipe() { return this; }
        invoke() {
            return Promise.resolve({
                candidates: [
                    { source: 'ichiran', pattern: '食べて', part_of_speech: 'Verb', conjugation: 'Te-form', root_word: '食べる', meaning: 'Eat', nuance: 'Action', confidence: 0.9 },
                    { source: 'llm', pattern: 'いる', part_of_speech: 'Aux', conjugation: 'None', root_word: 'いる', meaning: 'Is', nuance: 'State', confidence: 0.9 }
                ]
            });
        }
    }
    return { ChatOpenAI };
});

// Mock LangChain Core Output Parsers
vi.mock('@langchain/core/output_parsers', () => {
    class JsonOutputParser {
        parse() { return {}; } // Not really used directly if we mock chain pipe?
        // In analyzer.ts: prompt.pipe(llm).pipe(parser)
        // If llm.pipe returns `this` (LLM), and we call pipe(parser)...
        // Actually the chain logic is: prompt -> pipe(llm) -> pipe(parser).
        // If we mock ChatOpenAI.pipe to return `this`, then `this.pipe(parser)` is called next.
        // It returns `this` again.
        // Then `this.invoke({ text })` is called.
        // Our mock invoke returns the final JSON. 
        // So parser mock doesn't need logic, just needs to exist to be new-able.
    }
    return { JsonOutputParser };
});

// Mock LangChain Core Prompts
vi.mock('@langchain/core/prompts', () => {
    class ChatPromptTemplate {
        static fromMessages() {
            return new ChatPromptTemplate();
        }
        pipe(model: any) { return model; }
    }
    return { ChatPromptTemplate };
});


const mockChain = {
    select: vi.fn(),
    eq: vi.fn(),
    textSearch: vi.fn(),
    ilike: vi.fn(),
    limit: vi.fn()
};
// Setup circular return
mockChain.select.mockReturnThis();
mockChain.eq.mockReturnThis();
mockChain.textSearch.mockReturnThis();
mockChain.ilike.mockReturnThis();
mockChain.limit.mockResolvedValue({
    data: [{ id: 'ku-1', character: '食べて' }],
    error: null
});

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => mockChain)
    }
}));

describe('Hybrid Analyzer', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Since we mock class implementation in factory, we can't easily change spy implementation per test 
        // unless we expose the spy. But for this unit test, static return is fine.
    });

    it('should combine linguistic and semantic analysis results', async () => {
        const text = "ご飯を食べている";
        const result = await analyzeSentence(text);

        expect(result.original_text).toBe(text);
        expect(result.candidates.length).toBeGreaterThan(0);

        const c = result.candidates[0];
        expect(c.pattern).toBe('食べて');
        // Check DB integration
        expect(c.db_matches).toBeDefined();
        if (c.db_matches) {
            expect(c.db_matches.length).toBeGreaterThan(0);
        }
    });
});
