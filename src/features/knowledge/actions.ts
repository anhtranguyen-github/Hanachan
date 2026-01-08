'use server';

import { createClient } from "@/services/supabase/server";
import { revalidatePath } from "next/cache";
import fs from 'fs/promises';
import path from 'path';

// --- V7 Data Helpers ---

async function readV7Table(tableName: string) {
    const filePath = path.join(process.cwd(), 'data_v7', `${tableName}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
}

// --- Server Actions ---


export async function getLocalRelations(type: string, identity: string) {
    const slug = `${type}/${decodeURIComponent(identity)}`;

    try {
        if (type === 'kanji') {
            const data = await readV7Table('ku_kanji');
            const item = data.find((i: any) => i.ku_id === slug);
            if (item) {
                return {
                    related_vocab: item.metadata?.raw_v6?.amalgamations?.map((a: any) => ({
                        id: a.vocab,
                        type: 'vocabulary',
                        display: a.vocab,
                        subText: a.meaning
                    })) || [],
                    components: item.metadata?.raw_v6?.components?.map((c: any) => ({
                        id: c,
                        type: 'radical',
                        display: c,
                        subText: 'Component'
                    })) || []
                };
            }
        } else if (type === 'vocabulary') {
            const data = await readV7Table('ku_vocabulary');
            const item = data.find((i: any) => i.ku_id === slug);

            // Get sentences from relations
            const allToSentence = await readV7Table('ku_to_sentence');
            const allSentences = await readV7Table('sentences');
            const sIds = allToSentence.filter((r: any) => r.ku_id === slug).map((r: any) => r.sentence_id);
            const itemSentences = allSentences.filter((s: any) => sIds.includes(s.id));

            if (item) {
                return {
                    components: item.metadata?.raw_v6?.components?.map((c: any) => ({
                        id: c,
                        type: 'kanji',
                        display: c,
                        subText: 'Kanji'
                    })) || [],
                    examples: itemSentences.map((s: any) => ({
                        jp: s.text_ja,
                        en: s.text_en,
                        source: 'local'
                    })) || []
                };
            }
        } else if (type === 'grammar') {
            const data = await readV7Table('ku_grammar');
            const item = data.find((i: any) => i.ku_id === slug);

            // Get sentences
            const allToSentence = await readV7Table('ku_to_sentence');
            const allSentences = await readV7Table('sentences');
            const sIds = allToSentence.filter((r: any) => r.ku_id === slug).map((r: any) => r.sentence_id);
            const itemSentences = allSentences.filter((s: any) => sIds.includes(s.id));

            if (item) {
                const raw = item.metadata?.raw_v6 || {};
                const relatedGrammar = raw.related_grammar?.map((slug: string) => ({
                    id: slug,
                    type: 'grammar',
                    display: slug, // We only have slug here, usually requires a lookup
                    subText: 'Related Grammar'
                })) || [];

                const relatedKanji = raw.related_kanji?.map((char: string) => ({
                    id: char,
                    type: 'kanji',
                    display: char,
                    subText: 'Related Kanji'
                })) || [];

                return {
                    related_grammar: relatedGrammar,
                    related_kanji: relatedKanji,
                    examples: itemSentences.map((s: any) => ({
                        jp: s.text_ja,
                        en: s.text_en,
                        source: 'local'
                    })) || []
                };
            }
        } else if (type === 'radical') {
            const data = await readV7Table('ku_radicals');
            const item = data.find((i: any) => i.ku_id === slug);
            if (item) {
                return {
                    found_in_kanji: item.metadata?.raw_v6?.found_in_kanji?.map((k: any) => {
                        const decoded = decodeURIComponent(k);
                        return {
                            id: decoded,
                            type: 'kanji',
                            display: decoded,
                            subText: 'Kanji'
                        };
                    }) || []
                };
            }
        }
    } catch (e) {
        console.error("Error in getLocalRelations (V7):", e);
    }
    return null;
}


export async function getLocalLevelData(level: number, type: string) {
    try {
        const kus = await readV7Table('knowledge_units');
        const list = kus.filter((k: any) => k.level === level && k.type === (type === 'vocab' ? 'vocabulary' : type));

        // For reading data in explorer, we might want to join with detail tables
        // but for now, we'll try to get basic items.
        // To show reading in the browser, cards need 'reading'.

        let detailTable = '';
        if (type === 'kanji') detailTable = 'ku_kanji';
        else if (type === 'vocabulary' || type === 'vocab') detailTable = 'ku_vocabulary';

        let readingsMap = new Map();
        if (detailTable) {
            const details = await readV7Table(detailTable);
            details.forEach((d: any) => {
                const r = d.reading_primary || d.reading_data?.onyomi?.[0] || d.reading_data?.[0];
                if (r) readingsMap.set(d.ku_id, r);
            });
        }

        return list.map((item: any) => ({
            ...item,
            reading: readingsMap.get(item.slug) || ''
        }));
    } catch (e) {
        console.error("Error in getLocalLevelData (V7):", e);
        return [];
    }
}

export async function getLocalKU(type: string, id: string) {
    const slug = `${type}/${decodeURIComponent(id)}`;

    try {
        const kus = await readV7Table('knowledge_units');
        const base = kus.find((k: any) => k.slug === slug);
        if (!base) return null;

        let detailName = '';
        if (type === 'kanji') detailName = 'ku_kanji';
        else if (type === 'vocabulary') detailName = 'ku_vocabulary';
        else if (type === 'radical') detailName = 'ku_radicals';
        else if (type === 'grammar') detailName = 'ku_grammar';

        const details = await readV7Table(detailName);
        const detail = details.find((d: any) => d.ku_id === slug);


        return {
            ...base,
            ...detail,
            // Consistency with frontend expectations
            meanings: detail?.meaning_data?.meanings || [],
            readings: detail?.reading_data || (detail?.reading_primary ? [detail.reading_primary] : []),
            metadata: detail?.metadata?.raw_v6 || detail?.metadata || {}
        };

    } catch (e) {
        console.error("Error in getLocalKU (V7):", e);
        return null;
    }
}

export async function seedDatabaseAction() {
    const supabase = createClient();

    // In V7, seeding can be more robust by reading the new normalized files
    // This is a partial version, ideally we'd loop through the 30k units
    // but for now keeping the mock signature or implement a batch seed.

    try {
        const units = await readV7Table('knowledge_units');
        // Limit to first few for "seed" demo to avoid timeout
        const subset = units.slice(0, 10);

        for (const item of subset) {
            await supabase.from('knowledge_units').upsert({
                slug: item.slug,
                character: item.character,
                type: item.type,
                level: item.level,
                meaning: item.meaning,
                search_key: item.search_key
            });
        }
    } catch (e) {
        console.error("Seed failed:", e);
    }

    revalidatePath('/');
    return { success: true };
}
