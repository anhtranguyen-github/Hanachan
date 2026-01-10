import { z } from "zod";

export const RadicalSchema = z.object({
    id: z.string().uuid(),
    character: z.string().nullable(),
    name: z.string(),
    slug: z.string(),
    level: z.number().int(),
    meaning: z.string(),
    mnemonic: z.string(),
    url: z.string().url().nullable(),
    mnemonic_image: z.object({
        src: z.string(),
        alt: z.string()
    }).nullable().optional(),
    kanji_slugs: z.array(z.string()).optional(),
    created_at: z.string().optional()
});

export const KanjiSchema = z.object({
    id: z.string().uuid(),
    character: z.string(),
    level: z.number().int(),
    url: z.string().url().nullable(),
    meanings: z.object({
        primary: z.array(z.string()),
        alternatives: z.array(z.string()),
        mnemonic: z.string()
    }),
    readings: z.object({
        onyomi: z.array(z.string()),
        kunyomi: z.array(z.string()),
        nanori: z.array(z.string()),
        mnemonic: z.string()
    }),
    radicals: z.array(z.object({
        character: z.string().nullable(),
        name: z.string(),
        url: z.string().nullable()
    })).optional(),
    visually_similar: z.array(z.any()).optional(),
    amalgamations: z.array(z.any()).optional(),
    created_at: z.string().optional()
});

export const VocabularySchema = z.object({
    id: z.string().uuid(),
    character: z.string(),
    level: z.number().int(),
    url: z.string().url().nullable(),
    meanings: z.object({
        primary: z.array(z.string()),
        alternatives: z.array(z.string()),
        word_types: z.array(z.string()),
        explanation: z.string()
    }),
    readings: z.object({
        primary: z.string(),
        explanation: z.string(),
        audio: z.array(z.any())
    }),
    collocations: z.array(z.any()).optional(),
    context_sentences: z.array(z.object({
        ja: z.string(),
        en: z.string()
    })).optional(),
    components: z.array(z.any()).optional(),
    created_at: z.string().optional()
});

export const GrammarSchema = z.object({
    id: z.string().uuid(),
    slug: z.string(),
    title: z.string(),
    level: z.number().int(),
    url: z.string().url().nullable(),
    meanings: z.array(z.string()),
    structure: z.object({
        patterns: z.array(z.string()),
        variants: z.any()
    }),
    details: z.any(),
    about: z.any(),
    examples: z.array(z.object({
        ja: z.string(),
        en: z.string(),
        meaning: z.string().optional()
    })).optional(),
    related: z.array(z.any()).optional(),
    created_at: z.string().optional()
});

export const CRSQuerySchema = z.object({
    level: z.coerce.number().int().optional(),
    page: z.coerce.number().int().min(1).default(1),
    page_size: z.coerce.number().int().min(1).max(500).default(100)
});

export type Radical = z.infer<typeof RadicalSchema>;
export type Kanji = z.infer<typeof KanjiSchema>;
export type Vocabulary = z.infer<typeof VocabularySchema>;
export type Grammar = z.infer<typeof GrammarSchema>;
