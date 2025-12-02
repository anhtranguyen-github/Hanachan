
/**
 * Business rules for processing Japanese sentence tokens.
 */

export interface Token {
    surface: string;
    pos: string; // Part of speech
    reading?: string;
    base?: string; // Dictionary form
}

export interface AnalyzedUnit {
    surface: string;
    type: 'kanji' | 'vocabulary' | 'grammar' | 'particle' | 'punctuation' | 'other';
    metadata?: any;
}

/**
 * Maps raw tokens from a morphological analyzer to Hana-chan's AnalyzedUnits.
 */
export function mapTokensToUnits(tokens: Token[]): AnalyzedUnit[] {
    return tokens.map(token => {
        let type: AnalyzedUnit['type'] = 'other';

        if (token.pos === '助詞') type = 'particle';
        else if (token.pos === '記号') type = 'punctuation';
        else if (['名詞', '動詞', '形容詞', '副詞'].includes(token.pos)) type = 'vocabulary';

        // Simple logic: if contains kanji, it's vocab/kanji
        if (/[一-龠]/.test(token.surface)) {
            type = 'vocabulary';
        }

        return {
            surface: token.surface,
            type,
            metadata: {
                pos: token.pos,
                base: token.base
            }
        };
    });
}

/**
 * Extracts unique kanji from a set of tokens for CKB mapping.
 */
export function extractUniqueKanji(text: string): string[] {
    const kanjiRegex = /[一-龠]/g;
    const matches = text.match(kanjiRegex) || [];
    return [...new Set(matches)];
}
