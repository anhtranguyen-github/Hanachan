export type KUType = 'radical' | 'kanji' | 'vocabulary' | 'grammar';

export interface KnowledgeUnit {
    id: string;
    type: KUType;
    character: string;
    level: number;
    meaning: string;
    details: any; // Raw JSON from DB
}

export interface IKURepository {
    getById(id: string, type: KUType): Promise<KnowledgeUnit | null>;
    getByLevel(level: number, type: KUType): Promise<KnowledgeUnit[]>;
    search(query: string, type?: KUType): Promise<KnowledgeUnit[]>;
}
