
import { supabase, supabaseService } from './supabase';

const ensureObject = (val: any) => (Array.isArray(val) ? val[0] : val);

export async function getKanjiData(character: string) {
    const { data: ku, error } = await supabase
        .from('knowledge_units')
        .select(`
            *,
            ku_kanji (*),
            kanji_radicals!kanji_radicals_kanji_fkey (
                radical:knowledge_units!kanji_radicals_radical_fkey (character, meaning)
            )
        `)
        .eq('character', character)
        .eq('type', 'kanji')
        .single();

    if (error || !ku) {
        console.error('getKanjiData error:', error);
        return null;
    }

    const detail = ensureObject(ku.ku_kanji);

    // Fetch amalgamations (vocabulary using this kanji)
    const { data: amalgamations } = await supabase
        .from('vocab_kanji')
        .select(`
            vocabulary:knowledge_units!vocab_kanji_vocab_fkey (
                character,
                meaning,
                ku_vocabulary (reading_primary)
            )
        `)
        .eq('kanji_id', ku.id);

    const mData = detail?.meaning_data || {};
    const rData = detail?.reading_data || {};

    return {
        character: ku.character,
        level: ku.level,
        url: detail?.video || ku.mnemonics?.wanikani_url,
        meanings: {
            primary: mData.primary || [ku.meaning],
            alternatives: mData.alternatives || [],
            mnemonic: mData.mnemonic || ku.mnemonics?.meaning || []
        },
        readings: {
            onyomi: rData.onyomi || [],
            kunyomi: rData.kunyomi || [],
            mnemonic: rData.mnemonic || ku.mnemonics?.reading || []
        },
        radicals: ku.kanji_radicals?.map((r: any) => ({
            character: r.radical?.character,
            name: r.radical?.meaning
        })) || [],
        amalgamations: amalgamations?.map((a: any) => ({
            character: a.vocabulary?.character,
            meaning: a.vocabulary?.meaning,
            reading: ensureObject(a.vocabulary?.ku_vocabulary)?.reading_primary
        })) || [],
        visually_similar: []
    };
}

export async function getVocabData(character: string) {
    const { data: ku, error } = await supabase
        .from('knowledge_units')
        .select(`
            *,
            ku_vocabulary (*),
            vocab_kanji!vocab_kanji_vocab_fkey (
                kanji:knowledge_units!vocab_kanji_kanji_fkey (character, meaning, ku_kanji(reading_data))
            ),
            ku_to_sentence (
                sentences (text_ja, text_en)
            )
        `)
        .eq('character', character)
        .eq('type', 'vocabulary')
        .maybeSingle();

    if (error || !ku) {
        console.error('getVocabData error:', error);
        return null;
    }

    const detail = ensureObject(ku.ku_vocabulary);
    const mData = detail?.meaning_data || {};

    return {
        character: ku.character,
        level: ku.level,
        meanings: {
            primary: mData.primary || [ku.meaning],
            word_types: mData.word_types || detail?.parts_of_speech || [],
            explanation: mData.explanation || ku.mnemonics?.meaning || []
        },
        readings: {
            primary: detail?.reading_primary,
            explanation: detail?.reading_data?.explanation || ku.mnemonics?.reading || []
        },
        components: ku.vocab_kanji?.map((k: any) => ({
            character: k.kanji?.character,
            meaning: k.kanji?.meaning,
            reading: ensureObject(k.kanji?.ku_kanji)?.reading_data?.onyomi?.[0] || '?'
        })) || [],
        context_sentences: ku.ku_to_sentence?.map((s: any) => ({
            ja: s.sentences?.text_ja,
            en: s.sentences?.text_en
        })) || [],
        collocations: [],
        url: ku.mnemonics?.wanikani_url
    };
}

export async function getRadicalData(identifier: string) {
    // Simple Japanese character detection without Unicode property escapes
    const isChar = identifier.length === 1 && /[\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/.test(identifier);

    let query = supabase
        .from('knowledge_units')
        .select('*, ku_radicals(*)')
        .eq('type', 'radical');

    if (isChar) {
        query = query.eq('character', identifier);
    } else {
        query = query.ilike('meaning', identifier);
    }

    const { data: ku, error } = await query.maybeSingle();

    if (error || !ku) return null;

    const detail = ensureObject(ku.ku_radicals);

    // Get kanji slugs for this radical
    const { data: kanjiLinks } = await supabase
        .from('kanji_radicals')
        .select(`
            kanji:knowledge_units!kanji_radicals_kanji_fkey (slug)
        `)
        .eq('radical_id', ku.id);

    return {
        character: ku.character,
        name: detail?.name || ku.meaning,
        meaning: ku.meaning,
        level: ku.level,
        mnemonic: ku.mnemonics?.meaning,
        mnemonic_image: ku.mnemonics?.image_url ? { src: ku.mnemonics?.image_url, alt: ku.meaning } : null,
        url: ku.mnemonics?.wanikani_url,
        kanji_slugs: kanjiLinks?.map((l: any) => l.kanji?.slug?.replace('kanji:', '')) || []
    };
}

export async function getKanjiBySlug(slug: string) {
    const fullSlug = slug.includes(':') ? slug : `kanji:${slug}`;
    const { data: ku } = await supabase
        .from('knowledge_units')
        .select('*, ku_kanji(*)')
        .eq('slug', fullSlug)
        .eq('type', 'kanji')
        .maybeSingle();

    if (!ku) return null;
    const detail = ensureObject(ku.ku_kanji);

    return {
        character: ku.character,
        meanings: detail?.meaning_data || { primary: [ku.meaning] },
        level: ku.level
    };
}

export async function getGrammarData(slug: string) {
    const decoded = decodeURIComponent(slug);
    const canonical = decoded.includes(':') ? decoded : `grammar:${decoded}`;

    const client = supabaseService || supabase;
    let kuQuery = client
        .from('knowledge_units')
        .select(`
            *,
            ku_grammar (*),
            grammar_relations!fk_gr_1 (
                type,
                comparison_note,
                related_grammar:knowledge_units!fk_gr_2 (
                    slug,
                    character,
                    meaning,
                    level
                )
            ),
            ku_to_sentence (
                sentences (
                    text_ja,
                    text_en,
                    metadata
                )
            )
        `)
        .eq('type', 'grammar');

    let { data: ku, error } = await kuQuery.eq('slug', canonical).maybeSingle();

    if (error || !ku) {
        return null;
    }

    const grammarNode = ku.ku_grammar;
    const blob = grammarNode?.content_blob || {};

    const result = {
        title: ku.character || ku.slug,
        title_with_furigana: blob.furigana || ku.character || ku.slug,
        level: ku.level,
        meanings: [ku.meaning].filter(Boolean),
        structure: grammarNode?.structure || { patterns: [] },
        about: {
            text: blob.about_description || grammarNode?.details || "No description available."
        },
        cautions: (blob.cautions || []).map((c: any) => typeof c === 'string' ? c : c.text || '').filter(Boolean),
        fun_facts: blob.fun_facts || [],
        details: {
            part_of_speech: blob.details_expanded?.part_of_speech || grammarNode?.details,
            word_type: blob.details_expanded?.word_type || "Grammar",
            register: blob.details_expanded?.register || "Standard"
        },
        related: ku.grammar_relations?.map((r: any) => ({
            type: r.type.charAt(0).toUpperCase() + r.type.slice(1),
            title: r.related_grammar?.character || r.related_grammar?.slug,
            level: `N${6 - Math.ceil((r.related_grammar?.level || 1) / 10)}`,
            slug: r.related_grammar?.slug?.replace('grammar:', ''),
            comparison_note: r.comparison_note
        })) || [],
        examples: ku.ku_to_sentence?.map((s: any) => ({
            japanese: s.sentences?.text_ja,
            english: s.sentences?.text_en,
            sentence_structure: s.sentences?.metadata?.structure || [],
            audio_url: s.sentences?.metadata?.audio_url
        })) || []
    };

    return result;
}

export async function listGrammarData(level: number, userId?: string) {
    const { data: kus, error } = await supabase
        .from('knowledge_units')
        .select(`
            *,
            ku_grammar (*),
            user_learning_states (state, reps, lapses, next_review)
        `)
        .eq('type', 'grammar')
        .eq('level', level);

    if (error) return [];
    return kus;
}

export async function listKUsData(type: 'kanji' | 'vocabulary' | 'radical', level: number, userId?: string) {
    const { data: kus, error } = await supabase
        .from('knowledge_units')
        .select(`
            *,
            user_learning_states (state, reps, lapses, next_review)
        `)
        .eq('type', type)
        .eq('level', level);

    if (error) return [];
    return kus;
}
