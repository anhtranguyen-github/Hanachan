export type KUType = 'radical' | 'kanji' | 'vocabulary' | 'grammar';

export interface KnowledgeUnit {
    id: string;
    slug: string;
    type: KUType;
    character: string;
    level: number;
    meaning: string;
    details: any;
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
