import { z } from 'zod';
import { KnowledgeUnitSchema, KnowledgeUnitTypeSchema } from '@/lib/validation';

export type KnowledgeUnitType = z.infer<typeof KnowledgeUnitTypeSchema>;
export interface KnowledgeUnit extends z.infer<typeof KnowledgeUnitSchema> {
    radicals?: any[];
    kanji?: any[];
    vocabulary?: any[];
    sentences?: any[];
    related_grammar?: any[];
    user_learning_states?: any;
}

export interface RadicalDetails {
    ku_id: string;
    meaning_mnemonic?: string | null;
    image_url?: string | null;
}

export interface KanjiDetails {
    ku_id: string;
    onyomi?: string[] | null;
    kunyomi?: string[] | null;
    meaning_mnemonic?: string | null;
    reading_mnemonic?: string | null;
}

export interface VocabularyDetails {
    ku_id: string;
    reading: string;
    audio_url?: string | null;
    parts_of_speech?: string[] | null;
    meaning_mnemonic?: string | null;
}

export interface GrammarDetails {
    ku_id: string;
    structure?: string | null;
    explanation?: string | null;
    nuance?: string | null;
    cautions?: string | null;
    external_links?: any;
    example_sentences?: any[];
}

// We don't necessarily need IKURepository interface if we are not doing strict Dependency Injection with multiple implementations anymore.
// But keeping the types is useful.
