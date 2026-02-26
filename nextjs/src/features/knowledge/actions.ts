'use server';

import { curriculumRepository } from './db';

// --- Server Actions ---

export async function getUnitRelations(type: string, identity: string) {
    // Identity is usually the slug - for now only grammar relations are supported
    if (type === 'grammar') {
        return await curriculumRepository.getGrammarRelations(identity);
    }
    return [];
}


export async function getLevelData(level: number, type: string) {
    try {
        const typeFilter = type === 'vocab' ? 'vocabulary' : type;
        const items = await curriculumRepository.listByType(typeFilter as any, level);

        return items.map((item: any) => {
            // Map structure to what frontend expects for explorer lists
            let reading = '';
            if (item.type === 'kanji')
                reading = item.kanji_details?.onyomi?.[0] || item.kanji_details?.reading_data?.on?.[0] || '';
            else if (item.type === 'vocabulary')
                reading = item.vocabulary_details?.reading || item.vocabulary_details?.reading_primary || '';

            return {
                ...item,
                reading: reading
            };
        });
    } catch (e) {
        console.error("Error in getLevelData:", e);
        return [];
    }
}

export async function getKnowledgeUnit(type: string, slug: string) {
    try {
        let item: any = await curriculumRepository.getBySlug(slug, type as any);

        if (!item) return null;

        // Flatten/Normalize for frontend
        let meanings: string[] = [];
        let readings: string[] = [];
        let mStory: string = "";
        let rStory: string = "";

        const splitMeanings = item.meaning ? item.meaning.split(',').map((s: string) => s.trim()) : [];

        if (type === 'kanji' && item.kanji_details) {
            meanings = splitMeanings;
            const details = item.kanji_details;
            const onReadings = details.onyomi || [];
            const kunReadings = details.kunyomi || [];
            readings = [...onReadings, ...kunReadings];

            item.onReadings = onReadings;
            item.kunReadings = kunReadings;
            item.stroke_order_svg = details.stroke_order_svg;
            item.stroke_video_url = details.stroke_video_url;
            mStory = details.meaning_mnemonic || "";
            rStory = details.reading_mnemonic || "";
        } else if (type === 'vocabulary' && item.vocabulary_details) {
            meanings = splitMeanings;
            const details = item.vocabulary_details;
            readings = [details.reading];
            mStory = details.meaning_mnemonic || "";

            // Support legacy component keys
            item.ku_vocabulary = {
                ...details,
                reading_primary: details.reading,
                pitch_accent_data: details.pitch_accent,
                parts_of_speech: details.parts_of_speech || []
            };

            // Map newer schema back to what components expect for audio/pitch
            if (details.audio_url && !details.audio_data) {
                item.ku_vocabulary.audio_data = [{
                    url: details.audio_url,
                    metadata: { voice_actor_name: 'WaniKani' }
                }];
            }

            // Map context sentences
            if (details.context_sentences) {
                item.sentences = details.context_sentences.map((s: any) => ({
                    ja: s.ja || s.japanese || "",
                    en: s.en || s.english || ""
                }));
            }
        } else if (type === 'radical' && item.radical_details) {
            meanings = splitMeanings;
            item.ku_radicals = item.radical_details;
            item.image_url = item.radical_details.image_url;
            mStory = item.radical_details.meaning_mnemonic || "";
        } else if (type === 'grammar' && item.grammar_details) {
            meanings = splitMeanings;
            const details = item.grammar_details;
            mStory = details.explanation || "";

            // Map resources and structure for grammar
            item.resources = details.external_links || { online: [], offline: [] };
            item.structure = {
                variants: { standard: details.structure },
                patterns: []
            };
            item.ku_grammar = details;

            // Map example sentences for grammar
            if (details.example_sentences) {
                item.sentences = details.example_sentences.map((ex: any) => ({
                    ja: ex.japanese_clean || ex.ja || ex.japanese || "",
                    en: ex.english || ex.en || ""
                }));
            }
        } else {
            meanings = splitMeanings;
        }

        return {
            ...item,
            meanings: meanings.filter(Boolean),
            readings: readings.filter(Boolean),
            mnemonics: {
                meaning: mStory,
                reading: rStory
            },
            sentences: item.sentences || [],
            metadata: {}
        };

    } catch (e) {
        console.error("Error in getKnowledgeUnit:", e);
        return null;
    }
}

export { getKnowledgeUnit as getLocalKU };

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
