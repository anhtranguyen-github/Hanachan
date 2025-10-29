export type JLPTLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

export interface DictionaryEntry {
    word: string;
    reading: string;
    meanings: string[];
    jlptLevel?: JLPTLevel;
    examples: { ja: string; en: string }[];
    pitchAccent?: string;
    partOfSpeech?: string[];
    common?: boolean;
    tags?: string[];
    inflection?: string;
    baseForm?: string;
}

export type TokenStatus = 'UNSEEN' | 'LEARNING' | 'MASTERED' | 'EXCLUDED' | 'PROPER_NOUN';

export interface Token {
    index: number;
    surface: string;          // As written
    reading?: string;         // Furigana
    baseForm?: string;        // Dictionary form
    pos?: string;             // Part of speech
    jlptLevel?: JLPTLevel;
    status?: TokenStatus;
    meaning?: string;         // Quick meaning for analyzer
}

export interface GrammarPattern {
    id: string;
    name: string;
    pattern: string;
    jlptLevel: JLPTLevel;
    meaning: string;
}
