
import { KnowledgeUnit, KnowledgeUnitType } from "./types";

export function getDetailsTableName(type: KnowledgeUnitType): string {
    switch (type) {
        case 'radical': return 'radical_details';
        case 'kanji': return 'kanji_details';
        case 'vocabulary': return 'vocabulary_details';
        case 'grammar': return 'grammar_details';
        default: throw new Error(`Unknown unit type: ${type}`);
    }
}

export function mapToKnowledgeUnit(base: any, details: any, type: KnowledgeUnitType): KnowledgeUnit {
    const result: any = {
        ...base,
        id: base.id,
        slug: base.slug,
        type: base.type,
        character: base.character,
        level: base.level,
        jlpt: base.jlpt,
        meaning: base.meaning,
        details: details
    };

    // Attach details with the legacy key for UI compatibility
    const legacyKey = type === 'radical' ? 'ku_radicals' :
        type === 'kanji' ? 'ku_kanji' :
            type === 'vocabulary' ? 'ku_vocabulary' : 'ku_grammar';
    result[legacyKey] = details;

    // Also attach with the new correct key
    const currentKey = getDetailsTableName(type);
    result[currentKey] = details;

    return result;
}
