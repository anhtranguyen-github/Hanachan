/**
 * Unit tests for validation schemas.
 * Tests Zod schema validation logic without any external dependencies.
 */
import { describe, it, expect } from 'vitest';
import {
    KnowledgeUnitSchema,
    SRSStateSchema,
    ChatMessageSchema,
    ChatSessionSchema,
    KnowledgeUnitTypeSchema,
    SRSStageSchema,
    RatingSchema,
    uuidSchema,
} from '@/lib/validation';

describe('uuidSchema', () => {
    it('accepts valid UUIDs', () => {
        const result = uuidSchema.safeParse('550e8400-e29b-41d4-a716-446655440000');
        expect(result.success).toBe(true);
    });

    it('rejects invalid UUIDs', () => {
        const result = uuidSchema.safeParse('not-a-uuid');
        expect(result.success).toBe(false);
    });
});

describe('KnowledgeUnitTypeSchema', () => {
    it('accepts valid types', () => {
        const validTypes = ['radical', 'kanji', 'vocabulary', 'grammar'];
        for (const type of validTypes) {
            expect(KnowledgeUnitTypeSchema.safeParse(type).success).toBe(true);
        }
    });

    it('rejects invalid types', () => {
        expect(KnowledgeUnitTypeSchema.safeParse('sentence').success).toBe(false);
        expect(KnowledgeUnitTypeSchema.safeParse('').success).toBe(false);
    });
});

describe('SRSStageSchema', () => {
    it('accepts valid stages', () => {
        const validStages = ['new', 'learning', 'review', 'burned'];
        for (const stage of validStages) {
            expect(SRSStageSchema.safeParse(stage).success).toBe(true);
        }
    });

    it('rejects invalid stages', () => {
        expect(SRSStageSchema.safeParse('mastered').success).toBe(false);
    });
});

describe('RatingSchema', () => {
    it('accepts pass and again', () => {
        expect(RatingSchema.safeParse('pass').success).toBe(true);
        expect(RatingSchema.safeParse('again').success).toBe(true);
    });

    it('rejects other values', () => {
        expect(RatingSchema.safeParse('good').success).toBe(false);
        expect(RatingSchema.safeParse('hard').success).toBe(false);
    });
});

describe('KnowledgeUnitSchema', () => {
    const validKU = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        slug: 'kanji-water',
        type: 'kanji',
        character: '水',
        level: 3,
        jlpt: 5,
        meaning: 'water',
    };

    it('accepts a valid knowledge unit', () => {
        const result = KnowledgeUnitSchema.safeParse(validKU);
        expect(result.success).toBe(true);
    });

    it('rejects missing required fields', () => {
        const { slug, ...withoutSlug } = validKU;
        expect(KnowledgeUnitSchema.safeParse(withoutSlug).success).toBe(false);
    });

    it('rejects level out of range', () => {
        expect(KnowledgeUnitSchema.safeParse({ ...validKU, level: -1 }).success).toBe(false);
        expect(KnowledgeUnitSchema.safeParse({ ...validKU, level: 61 }).success).toBe(false);
    });

    it('accepts null character', () => {
        const result = KnowledgeUnitSchema.safeParse({ ...validKU, character: null });
        expect(result.success).toBe(true);
    });

    it('accepts optional id', () => {
        const { id, ...withoutId } = validKU;
        const result = KnowledgeUnitSchema.safeParse(withoutId);
        expect(result.success).toBe(true);
    });
});

describe('SRSStateSchema', () => {
    const validState = {
        stage: 'learning',
        stability: 1.5,
        difficulty: 2.0,
        reps: 3,
        lapses: 0,
    };

    it('accepts a valid SRS state', () => {
        expect(SRSStateSchema.safeParse(validState).success).toBe(true);
    });

    it('rejects negative stability', () => {
        expect(SRSStateSchema.safeParse({ ...validState, stability: -1 }).success).toBe(false);
    });

    it('rejects difficulty below 1.3', () => {
        expect(SRSStateSchema.safeParse({ ...validState, difficulty: 1.0 }).success).toBe(false);
    });

    it('rejects negative reps', () => {
        expect(SRSStateSchema.safeParse({ ...validState, reps: -1 }).success).toBe(false);
    });
});

describe('ChatMessageSchema', () => {
    const validMsg = {
        role: 'user',
        content: 'Hello, how do I say water in Japanese?',
        timestamp: new Date().toISOString(),
    };

    it('accepts a valid chat message', () => {
        expect(ChatMessageSchema.safeParse(validMsg).success).toBe(true);
    });

    it('accepts all valid roles', () => {
        for (const role of ['user', 'assistant', 'system']) {
            expect(ChatMessageSchema.safeParse({ ...validMsg, role }).success).toBe(true);
        }
    });

    it('rejects empty content', () => {
        expect(ChatMessageSchema.safeParse({ ...validMsg, content: '' }).success).toBe(false);
    });

    it('rejects invalid timestamp', () => {
        expect(ChatMessageSchema.safeParse({ ...validMsg, timestamp: 'not-a-date' }).success).toBe(false);
    });
});

describe('ChatSessionSchema', () => {
    const validSession = {
        id: 'session-123',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Japanese Practice',
        summary: null,
        messages: [],
        updatedAt: new Date().toISOString(),
    };

    it('accepts a valid chat session', () => {
        expect(ChatSessionSchema.safeParse(validSession).success).toBe(true);
    });

    it('accepts session without title', () => {
        const { title, ...withoutTitle } = validSession;
        expect(ChatSessionSchema.safeParse(withoutTitle).success).toBe(true);
    });

    it('rejects invalid userId (non-UUID)', () => {
        expect(ChatSessionSchema.safeParse({ ...validSession, userId: 'not-a-uuid' }).success).toBe(false);
    });
});
