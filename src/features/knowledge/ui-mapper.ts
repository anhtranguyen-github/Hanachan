
import { KnowledgeUnit } from "./types";
import { QuickViewData } from "@/components/shared/QuickViewModal";

export function mapKUToQuickView(ku: KnowledgeUnit): QuickViewData {
    const isGrammar = ku.type === 'grammar';
    const details = (ku as any).details || {};

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
    if (ku.type === 'kanji' && ku.radicals) {
        components = ku.radicals.map(r => ({
            character: r.character || r.slug,
            meaning: r.meaning || r.name || "",
            slug: r.slug
        }));
    } else if (ku.type === 'vocabulary' && ku.kanji) {
        components = ku.kanji.map(k => ({
            character: k.character || k.slug,
            meaning: k.meaning || "",
            slug: k.slug
        }));
    }

    return {
        type: isGrammar ? 'GRAMMAR' : 'TOKEN',
        title: ku.character || ku.slug.split(':')[1] || ku.slug,
        meaning: ku.meaning,
        reading: isGrammar ? "" : (details.reading || (Array.isArray(details.onyomi) ? details.onyomi[0] : "")),
        explanation: meaningMnemonic,
        reading_mnemonic: readingMnemonic,
        examples: examples,
        level: ku.level?.toString(),
        ku_type: ku.type,
        components: components,
        raw: ku
    };
}
