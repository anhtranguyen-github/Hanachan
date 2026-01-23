import fs from 'fs';
import path from 'path';

export interface GrammarExample {
    sentence_text: string;
    translation: string;
    audio_url: string | null;
    sentence_structure: Array<{
        type: 'text' | 'grammar_point';
        content: string;
    }>;
}

export interface GrammarRelated {
    slug: string;
    url: string;
    title: string;
    meaning: string;
    level: string;
    comparison_text: string;
}

export interface GrammarResource {
    online: Array<{
        title: string;
        url: string;
        source: string;
    }>;
    offline: Array<{
        book: string;
        page: string;
    }>;
}

export interface GrammarData {
    slug: string;
    url: string;
    level: number;
    title: string;
    title_with_furigana: string;
    meanings: string[];
    structure: {
        patterns: string[];
        variants: {
            standard: string | null;
            polite: string | null;
        };
    };
    details: {
        part_of_speech: string | null;
        word_type: string;
        register: string;
        rare_kanji: string | null;
    };
    about: {
        text: string;
        description: string;
    };
    cautions: Array<{
        text: string;
        html: string;
    }>;
    fun_facts: any[];
    synonyms: any[];
    antonyms: any[];
    related: GrammarRelated[];
    examples: GrammarExample[];
    resources: GrammarResource;
}

interface GrammarFile {
    total_count: number;
    level_counts: Record<string, number>;
    data: GrammarData[];
}

let grammarCache: GrammarData[] | null = null;

function loadGrammarData(): GrammarData[] {
    if (grammarCache) return grammarCache;

    try {
        const filePath = path.join(process.cwd(), 'grammar_process/raw/grammar.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const parsed: GrammarFile = JSON.parse(fileContent);
        grammarCache = parsed.data;
        return grammarCache;
    } catch (error) {
        console.error('Failed to load grammar data:', error);
        return [];
    }
}

export function getGrammarBySlug(slug: string): GrammarData | null {
    const data = loadGrammarData();

    // Normalize slug for matching
    const normalizedSlug = slug.toLowerCase().replace(/[：:]/g, '');

    const grammar = data.find(g => {
        const grammarSlug = g.slug.toLowerCase().replace(/[：:]/g, '');
        return grammarSlug === normalizedSlug || grammarSlug === slug;
    });

    return grammar || null;
}

export function getGrammarByLevel(level: number): GrammarData[] {
    const data = loadGrammarData();
    return data.filter(g => g.level === level);
}

export function searchGrammar(query: string): GrammarData[] {
    const data = loadGrammarData();
    const lowerQuery = query.toLowerCase();

    return data.filter(g =>
        g.title.toLowerCase().includes(lowerQuery) ||
        g.meanings.some(m => m.toLowerCase().includes(lowerQuery)) ||
        g.slug.toLowerCase().includes(lowerQuery)
    ).slice(0, 20);
}

export function getRelatedGrammarDetails(slugs: string[]): GrammarData[] {
    const data = loadGrammarData();
    return slugs.map(slug => {
        const normalizedSlug = slug.toLowerCase().replace(/[：:]/g, '');
        return data.find(g => g.slug.toLowerCase().replace(/[：:]/g, '') === normalizedSlug);
    }).filter(Boolean) as GrammarData[];
}

export function getTotalGrammarCount(): number {
    return loadGrammarData().length;
}
