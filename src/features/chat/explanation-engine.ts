
import { AnalyzedUnit } from '../sentence/token-processor';

/**
 * Business rules for structuring AI explanations.
 */

export interface ExplanationBlock {
    title: string;
    content: string;
    units?: string[]; // Referenced KU characters
}

/**
 * Structures an explanation based on analyzed units.
 * Rule: Group by type, prioritize Vocabulary then Grammar.
 */
export function structureExplanation(units: AnalyzedUnit[]): ExplanationBlock[] {
    const vocab = units.filter(u => u.type === 'vocabulary');
    const grammar = units.filter(u => u.type === 'grammar');

    const blocks: ExplanationBlock[] = [];

    if (vocab.length > 0) {
        blocks.push({
            title: 'Vocabulary Breakdown',
            content: vocab.map(v => `${v.surface}: ${v.metadata?.base || ''}`).join(', '),
            units: vocab.map(v => v.surface)
        });
    }

    if (grammar.length > 0) {
        blocks.push({
            title: 'Grammar Points',
            content: `This sentence uses: ${grammar.map(g => g.surface).join(' and ')}.`,
            units: grammar.map(g => g.surface)
        });
    }

    return blocks;
}
