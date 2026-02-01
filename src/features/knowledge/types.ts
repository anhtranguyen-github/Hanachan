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
    character?: string | null;
    name: string;
    meaning_story?: any;
    image_json?: any;
    metadata?: any;
}

export interface KanjiDetails {
    ku_id: string;
    character: string;
    meaning_data: any;
    reading_data: any;
    metadata?: any;
}

export interface VocabularyDetails {
    ku_id: string;
    character: string;
    reading_primary: string;
    meaning_data: any;
    audio_assets?: any;
    metadata?: any;
}

export interface GrammarDetails {
    ku_id: string;
    title: string;
    meaning_summary?: string | null;
    meaning_story?: any;
    structure_json?: any;
    metadata?: any;
}

// We don't necessarily need IKURepository interface if we are not doing strict Dependency Injection with multiple implementations anymore.
// But keeping the types is useful.
