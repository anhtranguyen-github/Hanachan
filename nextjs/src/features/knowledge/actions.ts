'use server';

import { kuRepository } from './db';

// --- Server Actions ---

export async function getLocalRelations(type: string, identity: string) {
    // Identity is usually the slug - for now only grammar relations are supported
    if (type === 'grammar') {
        return await kuRepository.getGrammarRelations(identity);
    }
    return [];
}


export async function getLocalLevelData(level: number, type: string) {
    try {
        const typeFilter = type === 'vocab' ? 'vocabulary' : type;
        const items = await kuRepository.listByType(typeFilter as any, level);

        return items.map((item: any) => {
            // Map structure to what frontend expects for explorer lists
            let reading = '';
            if (item.type === 'kanji') reading = item.ku_kanji?.reading_data?.on?.[0] || '';
            else if (item.type === 'vocabulary') reading = item.ku_vocabulary?.reading_primary || '';

            return {
                ...item,
                reading: reading
            };
        });
    } catch (e) {
        console.error("Error in getLocalLevelData:", e);
        return [];
    }
}

export async function getLocalKU(type: string, slug: string) {
    try {
        let item: any = await kuRepository.getBySlug(slug, type as any);

        if (!item) return null;

        // Flatten/Normalize for frontend
        let meanings: string[] = [];
        let readings: string[] = [];

        if (type === 'kanji' && item.ku_kanji) {
            const mData = item.ku_kanji.meaning_data;
            const rData = item.ku_kanji.reading_data;

            if (mData?.meanings) {
                meanings = mData.meanings.map((m: any) => typeof m === 'string' ? m : (m.meaning || ""));
            } else if (mData?.primary || mData?.alternatives) {
                meanings = [...(mData.primary || []), ...(mData.alternatives || [])];
            } else {
                meanings = [item.meaning];
            }

            const onReadings = (rData?.onyomi || rData?.on || []).map((r: any) => typeof r === 'string' ? r : (r.reading || ""));
            const kunReadings = (rData?.kunyomi || rData?.kun || []).map((r: any) => typeof r === 'string' ? r : (r.reading || ""));
            readings = [...onReadings, ...kunReadings];

            item.onReadings = onReadings;
            item.kunReadings = kunReadings;

            // Ensure explanation is available for contextual nuance
            const mExplanation = mData?.explanation;
            const existingMnemonic = item.mnemonics?.meaning;

            if (!existingMnemonic && mExplanation) {
                item.mnemonics = {
                    ...item.mnemonics,
                    meaning: mExplanation
                };
            }

            // Extract reading mnemonic if available
            const rExplanation = rData?.explanation;
            if (!item.mnemonics?.reading && rExplanation) {
                item.mnemonics = {
                    ...item.mnemonics,
                    reading: rExplanation
                };
            }

        } else if (type === 'vocabulary' && item.ku_vocabulary) {
            const mData = item.ku_vocabulary.meaning_data;
            if (mData?.meanings) {
                meanings = mData.meanings.map((m: any) => typeof m === 'string' ? m : (m.meaning || ""));
            } else if (mData?.primary || mData?.alternatives) {
                meanings = [...(mData.primary || []), ...(mData.alternatives || [])];
            } else {
                meanings = [item.meaning];
            }
            readings = [item.ku_vocabulary.reading_primary];

            // Extract context sentences from meaning_data if they exist
            if (mData?.context_sentences && Array.isArray(mData.context_sentences)) {
                const embeddedSentences = mData.context_sentences.map((s: any) => ({
                    text_ja: s.ja,
                    text_en: s.en,
                    source_type: 'internal'
                }));
                // Merge with existing linked sentences - avoiding duplicates
                const existingTexts = new Set(item.sentences?.map((s: any) => s.text_ja));
                const uniqueNew = embeddedSentences.filter((s: any) => !existingTexts.has(s.text_ja));
                item.sentences = [...(item.sentences || []), ...uniqueNew];
            }

            // Ensure explanation is available for contextual nuance
            const mExplanation = mData?.explanation;
            const existingMnemonic = item.mnemonics?.meaning;

            if (!existingMnemonic && mExplanation) {
                item.mnemonics = {
                    ...item.mnemonics,
                    meaning: mExplanation
                };
            }

            // Extract reading mnemonic if available
            const rExplanation = item.ku_vocabulary.reading_data?.explanation;
            if (!item.mnemonics?.reading && rExplanation) {
                item.mnemonics = {
                    ...item.mnemonics,
                    reading: rExplanation
                };
            }
        } else if (type === 'radical' && item.ku_radicals) {
            meanings = [item.ku_radicals.name || item.meaning];
        } else if (type === 'grammar' && item.ku_grammar) {
            meanings = [item.ku_grammar.meaning_summary || item.meaning];
        } else {
            meanings = [item.meaning];
        }

        return {
            ...item,
            meanings: meanings.filter(Boolean),
            readings: readings.filter(Boolean),
            sentences: item.sentences || [],
            metadata: {}
        };

    } catch (e) {
        console.error("Error in getLocalKU:", e);
        return null;
    }
}

export async function seedDatabaseAction() {
    return { success: true };
}

import { getGrammarData } from '@/lib/data-reader';

export async function getFullGrammarAction(slug: string) {
    try {
        return await getGrammarData(slug);
    } catch (e) {
        console.error("Error in getFullGrammarAction:", e);
        return null;
    }
}
