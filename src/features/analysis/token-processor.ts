import { KuromojiToken } from "./tokenizer";

export interface AnalyzedUnit {
    surface: string;
    reading?: string;
    basic_form: string;
    type: 'kanji' | 'vocabulary' | 'grammar' | 'particle' | 'punctuation' | 'other';
    pos: string;
    is_in_ckb: boolean;
    ku_slug?: string;
}

/**
 * Maps raw kuromoji tokens to Hana-chan's AnalyzedUnits, checking against the CKB.
 */
export function processTokens(tokens: KuromojiToken[], ckbSlugs: Set<string>): AnalyzedUnit[] {
    return tokens.map(token => {
        let type: AnalyzedUnit['type'] = 'other';
        const pos = token.pos;

        if (pos === '助詞') type = 'particle';
        else if (pos === '記号') type = 'punctuation';
        else if (['名詞', '動詞', '形容詞', '副詞', '助動詞'].includes(pos)) type = 'vocabulary';

        // Check CKB mapping
        // We check against the basic form (dictionary form)
        let is_in_ckb = false;
        let ku_slug: string | undefined = undefined;

        if (ckbSlugs.has(token.basic_form)) {
            is_in_ckb = true;
            ku_slug = token.basic_form;
        } else if (ckbSlugs.has(token.surface_form)) {
            is_in_ckb = true;
            ku_slug = token.surface_form;
        }

        return {
            surface: token.surface_form,
            reading: token.reading,
            basic_form: token.basic_form,
            type,
            pos,
            is_in_ckb,
            ku_slug
        };
    });
}

/**
 * Extracts all unique strings that could be Knowledge Units (Kanji, Vocab basic forms).
 */
export function extractPotentialKUSlugs(text: string, tokens: KuromojiToken[]): string[] {
    const slugs = new Set<string>();

    // 1. All unique Kanji
    const kanjiRegex = /[一-龠]/g;
    const kanjiMatches = text.match(kanjiRegex) || [];
    kanjiMatches.forEach(k => slugs.add(k));

    // 2. All token basic forms and surfaces
    tokens.forEach(t => {
        if (t.basic_form && t.basic_form !== '*') slugs.add(t.basic_form);
        slugs.add(t.surface_form);
    });

    return Array.from(slugs);
}
