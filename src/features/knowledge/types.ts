export type KUType = 'radical' | 'kanji' | 'vocabulary' | 'grammar';

export interface KnowledgeUnit {
    id: string;
    type: KUType;
    character: string;
    level: number;
    meaning: string;
    details: any; // Raw JSON from DB (Consider typing this strictly later)
}

// We don't necessarily need IKURepository interface if we are not doing strict Dependency Injection with multiple implementations anymore.
// But keeping the types is useful.
