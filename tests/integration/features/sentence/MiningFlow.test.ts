
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AI and other high-level deps before importing the service
vi.mock('@/features/analysis/ai-analyzer', () => ({
    aiSentenceAnalyzer: {
        analyze: vi.fn(),
        refine: vi.fn()
    }
}));
vi.mock('@/features/analysis/tokenizer', () => ({
    tokenize: vi.fn().mockResolvedValue([])
}));
vi.mock('@/features/analysis/token-processor', () => ({
    processTokens: vi.fn().mockReturnValue([]),
    extractPotentialKUSlugs: vi.fn().mockReturnValue(['猫'])
}));

import { sentenceService } from '@/features/sentence/service';
import { aiSentenceAnalyzer } from '@/features/analysis/ai-analyzer';
import { kuRepository } from '@/features/knowledge/db';
import { sentenceRepository } from '@/features/sentence/db';

vi.mock('@/features/knowledge/db');
vi.mock('@/features/sentence/db');

describe('Mining Integration Flow', () => {
    const userId = '00000000-0000-4000-8000-000000000001';
    const sentence = '私は猫です。';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should complete a full mining flow: analyze -> discover -> persist', async () => {
        // 1. Mock AI Analysis
        const mockAIResult = {
            translation: 'I am a cat.',
            grammar_points: [{ title: 'は', meaning: 'topic marker', explanation: 'topic', selector: 'は' }],
            recommendations: ['猫'],
            cloze_suggestion: { text: '私は[...]です。', cloze_index: 2 }
        };
        (aiSentenceAnalyzer.analyze as any).mockResolvedValue(mockAIResult);

        // 2. Mock KU Discovery
        (kuRepository.getBySlug as any).mockImplementation((slug: string, type: string) => {
            if (slug === '猫') return Promise.resolve({ id: 'ku-neko', slug: '猫', type: 'vocabulary' });
            return Promise.resolve(null);
        });

        // 3. Mock Persistence
        const mockResult = { id: 'sent-1', text_ja: sentence };
        (sentenceRepository.create as any).mockResolvedValue(mockResult);
        (kuRepository.createKU as any).mockResolvedValue({ id: 'ku-ha', slug: 'は', type: 'grammar' });

        // Run the service method
        const flowResult = await sentenceService.mine(sentence, userId);

        expect(flowResult.success).toBe(true);
        expect(flowResult.sentenceId).toBe('sent-1');

        expect(aiSentenceAnalyzer.analyze).toHaveBeenCalledWith(sentence);
        expect(kuRepository.createKU).toHaveBeenCalledWith(expect.objectContaining({ slug: 'は' }));
        expect(sentenceRepository.linkKUToSentence).toHaveBeenCalled();
        expect(sentenceRepository.createClozeCard).toHaveBeenCalled();
    });
});
