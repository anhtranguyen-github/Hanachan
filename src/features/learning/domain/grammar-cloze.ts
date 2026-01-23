/**
 * Grammar Cloze Generator
 * 
 * Generates on-the-fly cloze questions for grammar review.
 * Selects random sentences and creates blanks for the grammar pattern.
 */

import { supabase } from '@/lib/supabase';
import { GrammarReviewCard } from '../types/review-cards';

const LOG_PREFIX = '[GrammarCloze]';

interface GrammarKU {
    id: string;
    slug: string;
    character: string;
    meaning: string;
    level: number;
    ku_grammar?: {
        structure?: any;
        details?: string;
    };
}

interface Sentence {
    id: string;
    text_ja: string;
    text_en?: string;
    origin: string;
}

interface GrammarSentence {
    ku_id: string;
    sentence_id: string;
    is_primary?: boolean;
    sentences: Sentence;
}

/**
 * Select a random sentence for grammar review
 * Priorities:
 * 1. User-mined sentences (if any)
 * 2. Sentences not used recently
 * 3. Random from remaining pool
 */
export async function selectSentenceForGrammar(
    grammarId: string,
    recentSentenceIds: string[] = []
): Promise<Sentence | null> {
    console.log(`${LOG_PREFIX} Selecting sentence for grammar:`, grammarId);

    // Query all sentences linked to this grammar
    const { data: grammarSentences, error } = await supabase
        .from('ku_to_sentence')
        .select('*, sentences(*)')
        .eq('ku_id', grammarId)
        .limit(50);  // Get a pool to choose from

    if (error || !grammarSentences || grammarSentences.length === 0) {
        console.log(`${LOG_PREFIX} No sentences found for grammar:`, grammarId);
        return null;
    }

    console.log(`${LOG_PREFIX} Found ${grammarSentences.length} candidate sentences`);

    // Score and sort sentences
    const scored = grammarSentences.map((gs: any) => {
        let score = 0;

        // Prefer user-mined sentences
        if (gs.sentences.origin === 'user_mined') score += 10;

        // Avoid recently used sentences
        if (recentSentenceIds.includes(gs.sentence_id)) score -= 50;

        // Add randomness
        score += Math.random() * 5;

        return { ...gs, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // Pick top candidate
    const selected = scored[0];
    console.log(`${LOG_PREFIX} Selected sentence:`, selected.sentences.text_ja.substring(0, 30) + '...');

    return selected.sentences as Sentence;
}

/**
 * Find the grammar pattern in a sentence and create blank positions
 */
function findGrammarPattern(
    sentence: string,
    grammar: GrammarKU
): { match: string; start: number; end: number } | null {
    const grammarChar = grammar.character;

    if (!grammarChar) {
        console.log(`${LOG_PREFIX} Grammar has no character pattern`);
        return null;
    }

    // Try exact match first (simplified)
    const exactIndex = sentence.indexOf(grammarChar);
    if (exactIndex !== -1) {
        return { match: grammarChar, start: exactIndex, end: exactIndex + grammarChar.length };
    }

    // Try converting grammar containing ~ to Regex
    // e.g. "〜は〜となっている" -> /.?は.+となっている/
    // We treat leading ~ as optional start, middle ~ as wildcard
    if (grammarChar.includes('~') || grammarChar.includes('〜')) {
        try {
            // Escape special regex chars except ~ and 〜
            const escaped = grammarChar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Replace ~ with wildcard
            // Leading ~ -> "" (handled by search) or better simple ignored
            // Middle ~ -> .+ (at least one char)
            const regexPattern = escaped
                .replace(/^[〜~]/, '') // Remove leading
                .replace(/[〜~]/g, '.+'); // Middle ones become wildcard

            const regex = new RegExp(regexPattern);
            const match = sentence.match(regex);

            if (match && match.index !== undefined) {
                return {
                    match: match[0],
                    start: match.index,
                    end: match.index + match[0].length
                };
            }
        } catch (e) {
            console.error(`${LOG_PREFIX} Regex match error:`, e);
        }
    }

    // Try parsing the structure for patterns like "Vても", "Nが", etc.
    const structure = grammar.ku_grammar?.structure;
    if (structure && typeof structure === 'object') {
        const patterns = extractPatternsFromStructure(structure);
        for (const pattern of patterns) {
            // ... existing structure logic (could also be enhanced with regex)
            const index = sentence.indexOf(pattern);
            if (index !== -1) {
                return {
                    match: pattern,
                    start: index,
                    end: index + pattern.length
                };
            }
        }
    }

    // Fallback: Try common grammar particles and endings (Standard logic)
    const commonPatterns = extractCommonPatterns(grammarChar);
    for (const pattern of commonPatterns) {
        // Also try regex for common patterns if they are simple strings
        const index = sentence.indexOf(pattern);
        if (index !== -1) {
            return {
                match: pattern,
                start: index,
                end: index + pattern.length
            };
        }
    }

    console.log(`${LOG_PREFIX} Could not find grammar pattern in sentence`);
    return null;
}

/**
 * Extract searchable patterns from grammar structure
 */
function extractPatternsFromStructure(structure: any): string[] {
    const patterns: string[] = [];

    if (Array.isArray(structure)) {
        structure.forEach(item => {
            if (typeof item === 'string') patterns.push(item);
            if (item?.text) patterns.push(item.text);
            if (item?.pattern) patterns.push(item.pattern);
        });
    } else if (typeof structure === 'object') {
        if (structure.pattern) patterns.push(structure.pattern);
        if (structure.text) patterns.push(structure.text);
        if (structure.main) patterns.push(structure.main);
    }

    return patterns.filter(p => p && p.length > 0);
}

/**
 * Extract common patterns from grammar character
 * e.g., "〜ても" → ["ても", "でも"]
 */
function extractCommonPatterns(grammarChar: string): string[] {
    // Remove leading tilde or wave dash and numbering (①, etc.)
    const cleaned = grammarChar.replace(/^[〜~]/, '').replace(/[①-⑩]/g, '');

    const patterns: string[] = [cleaned];

    // Add variations

    // て→で conjugation
    if (cleaned.startsWith('て')) {
        patterns.push('で' + cleaned.slice(1));
    }

    // ます form replacements
    if (cleaned.endsWith('ます')) {
        patterns.push(cleaned.replace(/ます$/, 'ません'));
    }

    // ている -> ています
    if (cleaned.endsWith('ている')) {
        patterns.push(cleaned.replace(/ている$/, 'ています'));
        patterns.push(cleaned.replace(/ている$/, 'ていません'));
    }

    // ていく -> ていきます
    if (cleaned.endsWith('ていく')) {
        patterns.push(cleaned.replace(/ていく$/, 'ていきます'));
    }

    return patterns.filter(p => p.length > 0);
}

/**
 * Generate a cloze review card for a grammar KU
 */
export async function generateGrammarClozeCard(
    grammar: GrammarKU,
    userId?: string,
    recentSentenceIds: string[] = []
): Promise<GrammarReviewCard | null> {
    console.log(`${LOG_PREFIX} Generating cloze for grammar:`, grammar.character);

    // 1. Select a random sentence
    const sentence = await selectSentenceForGrammar(grammar.id, recentSentenceIds);

    if (!sentence) {
        console.log(`${LOG_PREFIX} No sentence available, returning null`);
        return null;
    }

    // 2. Find grammar pattern in sentence
    const pattern = findGrammarPattern(sentence.text_ja, grammar);

    if (!pattern) {
        // Fallback: Create a simple card without cloze
        console.log(`${LOG_PREFIX} Pattern not found, using fallback display`);
        return {
            id: `${grammar.id}-${sentence.id}`,
            ku_id: grammar.id,
            ku_type: 'grammar',
            prompt_variant: 'cloze',  // Grammar is ALWAYS cloze
            level: grammar.level,
            character: grammar.character,
            meaning: grammar.meaning,
            sentence_ja: sentence.text_ja,
            sentence_en: sentence.text_en,
            cloze_display: sentence.text_ja,  // No blank - fallback
            cloze_answer: grammar.character,
            cloze_start_index: 0,
            cloze_end_index: 0,
            sentence_id: sentence.id,
            sentence_source: sentence.origin === 'user_mined' ? 'user_mined' : 'official',
            grammar_structure: grammar.ku_grammar?.structure ?
                JSON.stringify(grammar.ku_grammar.structure) : undefined,
            grammar_hint: grammar.meaning
        };
    }

    // 3. Create cloze display with blank
    const beforeBlank = sentence.text_ja.substring(0, pattern.start);
    const afterBlank = sentence.text_ja.substring(pattern.end);
    const clozeDisplay = beforeBlank + '______' + afterBlank;

    console.log(`${LOG_PREFIX} Generated cloze: "${clozeDisplay.substring(0, 40)}..."`);

    return {
        id: `${grammar.id}-${sentence.id}`,
        ku_id: grammar.id,
        ku_type: 'grammar',
        prompt_variant: 'cloze',  // Grammar is ALWAYS cloze
        level: grammar.level,
        character: grammar.character,
        meaning: grammar.meaning,
        sentence_ja: sentence.text_ja,
        sentence_en: sentence.text_en,
        cloze_display: clozeDisplay,
        cloze_answer: pattern.match,
        cloze_start_index: pattern.start,
        cloze_end_index: pattern.end,
        sentence_id: sentence.id,
        sentence_source: sentence.origin === 'user_mined' ? 'user_mined' : 'official',
        grammar_structure: grammar.ku_grammar?.structure ?
            JSON.stringify(grammar.ku_grammar.structure) : undefined,
        grammar_hint: grammar.meaning
    };
}

/**
 * Validate user's cloze answer
 * Returns similarity score (0-1) for partial credit
 */
export function validateClozeAnswer(
    userInput: string,
    correctAnswer: string
): { correct: boolean; similarity: number } {
    // Normalize inputs
    const normalized = userInput.trim().toLowerCase();
    const expected = correctAnswer.trim().toLowerCase();

    // Exact match
    if (normalized === expected) {
        return { correct: true, similarity: 1.0 };
    }

    // Check for common variations (with/without particles, conjugations)
    const variations = [
        expected,
        expected.replace(/^[〜~]/, ''),
        expected.replace(/です$/, ''),
        expected.replace(/ます$/, ''),
    ];

    if (variations.some(v => normalized === v)) {
        return { correct: true, similarity: 0.95 };
    }

    // Calculate Levenshtein distance for partial credit
    const distance = levenshteinDistance(normalized, expected);
    const maxLen = Math.max(normalized.length, expected.length);
    const similarity = maxLen > 0 ? 1 - (distance / maxLen) : 0;

    // Consider correct if similarity > 0.8
    return {
        correct: similarity > 0.8,
        similarity
    };
}

/**
 * Simple Levenshtein distance calculation
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}
