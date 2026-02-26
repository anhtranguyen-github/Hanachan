
import { KnowledgeUnit } from "./types";
import { QuickViewData } from "@/components/shared/QuickViewModal";

export function mapUnitToQuickView(unit: KnowledgeUnit): QuickViewData {
    const isGrammar = unit.type === 'grammar';
    const details = (unit as any).details || {};

    // Extract mnemonics
    const meaningMnemonic = details.meaning_mnemonic || details.meaning_story || "";
    const readingMnemonic = details.reading_mnemonic || "";

    // Extract examples
    let examples: { ja: string; en: string }[] = [];
    if (isGrammar && details.example_sentences) {
        examples = details.example_sentences.map((ex: any) => ({
            ja: ex.ja || "",
            en: ex.en || ""
        }));
    }

    // Extract components (radicals for kanji, kanji for vocab)
    let components: { character: string; meaning: string; slug: string }[] = [];
    if (unit.type === 'kanji' && unit.radicals) {
        components = unit.radicals.map(r => ({
            character: r.character || r.slug,
            meaning: r.meaning || r.name || "",
            slug: r.slug
        }));
    } else if (unit.type === 'vocabulary' && unit.kanji) {
        components = unit.kanji.map(k => ({
            character: k.character || k.slug,
            meaning: k.meaning || "",
            slug: k.slug
        }));
    }

    return {
        type: isGrammar ? 'GRAMMAR' : 'TOKEN',
        title: unit.character || unit.slug.split(':')[1] || unit.slug,
        meaning: unit.meaning,
        reading: isGrammar ? "" : (details.reading || (Array.isArray(details.onyomi) ? details.onyomi[0] : "")),
        explanation: meaningMnemonic,
        reading_mnemonic: readingMnemonic,
        examples: examples,
        level: unit.level?.toString(),
        unit_type: unit.type,
        components: components,
        raw: unit
    };
}
