
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

    const getTitle = () => {
        if (unit.character) return unit.character;
        try {
            const decoded = decodeURIComponent(unit.slug);
            return decoded.replace(/^(vocab|kanji|radical|grammar)_/, '').replace(/[_-]/g, ' ');
        } catch (e) {
            return unit.slug;
        }
    };

    return {
        type: isGrammar ? 'GRAMMAR' : 'TOKEN',
        title: getTitle(),
        meaning: unit.meaning,
        reading: isGrammar ? "" : (details.reading || (Array.isArray(details.onyomi) ? details.onyomi[0] : "")),
        explanation: meaningMnemonic,
        reading_mnemonic: readingMnemonic,
        examples: examples,
        level: unit.level?.toString(),
        ku_type: unit.type,
        components: components,
        slug: unit.slug,
        raw: unit
    };
}
