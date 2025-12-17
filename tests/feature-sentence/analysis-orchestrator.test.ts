
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sentenceService } from '../../src/features/sentence/service';
import { aiSentenceAnalyzer } from '../../src/features/sentence/ai-analyzer';
import { kuRepository } from '../../src/features/knowledge/db';
import * as tokenizer from '../../src/features/sentence/tokenizer';

// Mocks
vi.mock('../../src/features/sentence/tokenizer', () => ({
    tokenize: vi.fn(),
}));

vi.mock('../../src/features/sentence/ai-analyzer', () => ({
    aiSentenceAnalyzer: {
        analyze: vi.fn(),
    }
}));

vi.mock('../../src/features/knowledge/db', () => ({
    kuRepository: {
        checkSlugsExist: vi.fn(),
    }
}));

describe('Comprehensive Sentence Analysis Orchestrator', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should complete the 4-stage analysis flow successfully', async () => {
        const text = '猫が好きです。';

        // Stage 1 Mock (Tokenization)
        (tokenizer.tokenize as any).mockResolvedValue([
            { surface_form: '猫', pos: '名詞', basic_form: '猫' },
            { surface_form: 'が', pos: '助詞', basic_form: 'が' },
            { surface_form: '好き', pos: '名詞', basic_form: '好き' },
            { surface_form: 'です', pos: '助動詞', basic_form: 'です' },
        ]);

        // Stage 2 Mock (CKB Mapping)
        (kuRepository.checkSlugsExist as any).mockResolvedValue(new Set(['猫', '好き']));

        // Stage 3 Mock (AI Insight)
        (aiSentenceAnalyzer.analyze as any).mockResolvedValue({
            translation: 'I like cats.',
            explanation: 'Subject object construction.',
            grammar_points: [{ title: '～が好き', meaning: 'to like' }],
            learning_recommendations: ['猫'],
            cloze_positions: [0]
        });

        // Execute
        const result = await sentenceService.analyze(text);

        // Verify Results
        expect(result.translation).toBe('I like cats.');
        expect(result.units[0].is_in_ckb).toBe(true);
        expect(result.units[0].surface).toBe('猫');
        expect(result.units[1].is_in_ckb).toBe(false); // Particles usually not in CKB slug set
        expect(result.grammar_points[0].title).toBe('～が好き');
    });
});
