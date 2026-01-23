
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveMinedSentenceAction, analyzeSentenceAction } from '@/features/mining/actions';

// Mock Analyzer Domain
vi.mock('@/features/mining/domain/analyzer', () => ({
    analyzeSentence: vi.fn().mockResolvedValue({
        original_text: "Test Sentence",
        candidates: [
            { source: 'ichiran', pattern: 'Test', db_matches: [] }
        ]
    })
}));

// Mock Next.js Cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}));

// Mock Supabase
const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpsert = vi.fn();
const mockEq = vi.fn();

const mockBuilder = {
    select: mockSelect,
    eq: mockEq,
    single: mockSingle,
    insert: mockInsert,
    upsert: mockUpsert
};

// Chainable logic
mockSelect.mockReturnValue(mockBuilder);
mockEq.mockReturnValue(mockBuilder);
mockInsert.mockReturnValue(mockBuilder);
mockUpsert.mockReturnValue(mockBuilder);

vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(() => mockBuilder)
    }
}));

describe('Mining Actions Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Setup Upsert to just resolve (it is awaited)
        mockUpsert.mockResolvedValue({ error: null });
    });

    it('should save a new sentence and link grammar', async () => {
        // First call: Check existing (return null to force insert)
        // Second call: Return inserted data (after insert().select().single())
        mockSingle
            .mockResolvedValueOnce({ data: null, error: null })
            .mockResolvedValueOnce({ data: { id: 'sent-1' }, error: null });

        const userId = 'user-123';
        const params = {
            text_ja: 'Test Sentence',
            text_en: 'Meaning',
            grammar_ids: ['g-1'],
        };

        const result = await saveMinedSentenceAction(userId, params);

        expect(result.success).toBe(true);
        expect(mockInsert).toHaveBeenCalled(); // Should be called now
        expect(mockUpsert).toHaveBeenCalled();
    });
});
