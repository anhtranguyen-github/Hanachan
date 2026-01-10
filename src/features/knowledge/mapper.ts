
import { KnowledgeUnit, KUType } from "./types";

export function getDetailsTableName(type: KUType): string {
    switch (type) {
        case 'radical': return 'ku_radicals';
        case 'kanji': return 'ku_kanji';
        case 'vocabulary': return 'ku_vocabulary';
        case 'grammar': return 'ku_grammar';
        default: throw new Error(`Unknown KU type: ${type}`);
    }
}

export function mapToKU(base: any, details: any, type: KUType): KnowledgeUnit {
    let meaning = "";

    if (type === 'radical') {
        meaning = details.name || "";
    } else if (type === 'grammar') {
        meaning = details.title || "";
    } else {
        const mData = details.meaning_data;
        if (mData) {
            if (Array.isArray(mData.primary)) meaning = mData.primary[0];
            else if (typeof mData.primary === 'string') meaning = mData.primary;
            else if (Array.isArray(mData)) meaning = mData[0];
        }
    }

    if (!meaning) meaning = base.slug;

    return {
        id: base.slug,
        slug: base.slug,
        type: base.type,
        character: type === 'grammar' ? (details.title || base.slug) : (type === 'radical' ? (details.character || base.slug) : (details.character || base.slug)),
        level: base.level,
        meaning: meaning,
        details: details
    };
}
