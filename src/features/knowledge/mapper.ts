
import { KnowledgeUnit, KUType } from "./types";

export function getDetailsTableName(type: KUType): string {
    switch (type) {
        case 'radical': return 'radical_details';
        case 'kanji': return 'kanji_details';
        case 'vocabulary': return 'vocabulary_details';
        case 'grammar': return 'grammar_details';
        default: throw new Error(`Unknown KU type: ${type}`);
    }
}

export function mapToKU(base: any, details: any, type: KUType): KnowledgeUnit {
    // In the new schema, basic info like 'meaning' and 'character' are already in the base table
    const result: any = {
        ...base,
        id: base.id,
        slug: base.slug,
        type: base.type,
        character: base.character || base.slug.split(':')[1],
        level: base.level,
        meaning: base.meaning,
        details: details
    };

    // Attach details with the legacy key just in case some components rely on it
    const legacyKey = type === 'radical' ? 'ku_radicals' :
        type === 'kanji' ? 'ku_kanji' :
            type === 'vocabulary' ? 'ku_vocabulary' : 'ku_grammar';
    result[legacyKey] = details;

    // Also attach with the new correct key
    const currentKey = getDetailsTableName(type);
    result[currentKey] = details;

    return result;
}
