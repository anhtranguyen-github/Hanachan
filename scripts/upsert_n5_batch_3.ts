
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

const n5_batch_3 = [
    {
        slug: "が-but",
        level: 5,
        title: "が (But)",
        meanings: ["But", "However"],
        structure: { patterns: ["Verb + が", "［い］Adj + が", "Noun/［な］Adj + だ/です + が"] },
        details: { part_of_speech: "Particle", word_type: "Conjunctive Particle", register: "Standard" },
        about: "Used to highlight that 'while (A) is true, there is extra/contrasting information (B)'. Functions similarly to 'but'.",
        fun_facts: ["When used to mean 'but', が is considered quite formal and direct. Ending a sentence with が implies the rest is obvious."],
        related: []
    },
    {
        slug: "が",
        level: 5,
        title: "が (Subject)",
        meanings: ["Subject marker", "Identification particle"],
        structure: { patterns: ["Subject + が"] },
        details: { part_of_speech: "Particle", word_type: "Case Marking Particle", register: "Standard" },
        about: "The subject marker. It highlights the one performing the action or the thing being identified. It focus on what comes BEFORE it.",
        fun_facts: ["は highlights what comes AFTER it; が highlights what comes BEFORE it. Usually used for new information."],
        related: [
            { slug: "は", type: "Contrast", comparison: "は marks the topic (already known); が marks the subject (often new info)." },
            { slug: "を", type: "Comparison", comparison: "が marks the doer; を marks the object being acted upon." }
        ]
    },
    {
        slug: "がある",
        level: 5,
        title: "がある",
        meanings: ["To be", "There is (Inanimate)"],
        structure: { patterns: ["Noun + が + ある/あります"] },
        details: { part_of_speech: "Expression", word_type: "Verb", register: "Standard" },
        about: "Used to express the existence or possession of non-living/inanimate things. ",
        fun_facts: ["ある is irregular in the casual negative form: it's 'ない', not 'あらない'."],
        related: [
            { slug: "がいらっしゃる", type: "Honorific", comparison: "いらっしゃる is a formal movement/existence verb." },
            { slug: "がいる", type: "Similar", comparison: "ある is for non-living; いる is for living things." }
        ]
    },
    {
        slug: "がある-noun",
        level: 5,
        title: "がある + Noun",
        meanings: ["Noun with Noun", "That has Noun"],
        structure: { patterns: ["Noun + が/の + ある + Noun"] },
        details: { part_of_speech: "Expression", word_type: "Noun", register: "Standard" },
        about: "A relative clause where 'Noun A がある' describes 'Noun B'. It functions like an adjective phrase.",
        fun_facts: ["In a relative clause, the 'が' can often be replaced by 'の' (e.g., ピアノのあるレストラン)."],
        related: []
    },
    {
        slug: "がいる",
        level: 5,
        title: "がいる",
        meanings: ["To be", "There is (Animate)"],
        structure: { patterns: ["Noun + が + いる/います"] },
        details: { part_of_speech: "Expression", word_type: "Verb", register: "Standard" },
        about: "Used to express the existence or possession of living/animate beings like people or animals.",
        fun_facts: ["Being a る-Verb, the polite form is just 'います'. The kanji 居(い)る is common but often written in kana."],
        related: [
            { slug: "がある", type: "Similar", comparison: "いる is for living; ある is for non-living things." },
            { slug: "いらっしゃる", type: "Honorific", comparison: "いらっしゃる is the honorific version of いる." }
        ]
    },
    {
        slug: "きらい",
        level: 5,
        title: "嫌い (きらい)",
        meanings: ["Dislike", "Not fond of"],
        structure: { patterns: ["Noun + が + 嫌い", "嫌い + な + Noun"] },
        details: { part_of_speech: "Noun", word_type: "Adjectival Noun", register: "Standard" },
        about: "A な-Adjective used to express dislike. The object of dislike is marked with が.",
        fun_facts: ["Despite ending in い, it is a な-Adjective. Pair with 大 (大嫌い) to mean 'hate'."],
        related: [
            { slug: "すき", type: "Antonym", comparison: "きらい is dislike; 好き is like." }
        ]
    },
    {
        slug: "くらい1",
        level: 5,
        title: "くらい / ぐらい",
        meanings: ["About", "Approximately"],
        structure: { patterns: ["Number/Counter + くらい/ぐらい", "どの + くらい"] },
        details: { part_of_speech: "Particle", word_type: "Adverbial Particle", register: "Standard" },
        about: "Used to express approximate amounts, durations, or extents. ぐらい is more common in speech.",
        fun_facts: ["Comes from the kanji 位 (rank/grade). Used for durations (10分くらい); use 'ごろ' for points in time (10時ごろ)."],
        related: [
            { slug: "ごろ", type: "Similar", comparison: "くらい for duration/extent; ごろ for specific clock time/date." }
        ]
    },
    {
        slug: "くる",
        level: 6,
        title: "くる (来(く)る)",
        meanings: ["To come"],
        structure: { patterns: ["くる", "きます (Polite)", "きた (Past)", "こない (Negative)"] },
        details: { part_of_speech: "Verb", word_type: "Independent Word", register: "Standard" },
        about: "One of the two irregular verbs in Japanese. Means movement toward the speaker's location.",
        fun_facts: ["The base 'ku' changes vowel sounds based on conjugation: [ki]ta, [ku]ru, [ko]nai. A 'Ka-column irregular' verb."],
        related: [
            { slug: "へいく", type: "Antonym", comparison: "くる is toward speaker; いく is away from speaker." }
        ]
    },
    {
        slug: "くれる",
        level: 6,
        title: "くれる",
        meanings: ["To give (to me/us)"],
        structure: { patterns: ["Giverは Recipientに Objectをくれる"] },
        details: { part_of_speech: "Verb", word_type: "Independent Word", register: "Standard" },
        about: "Means 'to give', but specifically when someone gives TO the speaker or someone in their 'in-group'.",
        fun_facts: ["The 'in-group' consists of family, close friends, or teammates. The direction is always 'toward the internal circle'."],
        related: [
            { slug: "あげる", type: "Contrast", comparison: "あげる is giving away; くれる is giving to the speaker group." }
        ]
    },
    {
        slug: "けっこう",
        level: 6,
        title: "けっこう (結構)",
        meanings: ["Quite", "A lot", "No thank you"],
        structure: { patterns: ["けっこう + Phrase", "けっこうです"] },
        details: { part_of_speech: "Adverb", word_type: "Ordinary", register: "Standard" },
        about: "Can act as a な-Adjective but most commonly used as an adverb for 'quite/fairly'. Also used for polite refusal.",
        fun_facts: ["Saying 'けっこうです' is a polite way to say 'I'm fine/No thank you' (literal: 'It is sufficient')."],
        related: []
    },
    {
        slug: "けけど-だけど",
        level: 6,
        title: "けど / だけど",
        meanings: ["But", "However"],
        structure: { patterns: ["Verb/Adj + けど", "Noun/［な］Adj + だけど"] },
        details: { part_of_speech: "Particle", word_type: "Conjunctive Particle", register: "Standard" },
        about: "The casual version of 'but'. Conjoins two phrases with contrasting information.",
        fun_facts: ["Hierarchy: けど (casual) < けれど < けれども < が (formal). The 'だ' in だけど is the copula required for nouns/な-adjectives."],
        related: [
            { slug: "が-but", type: "Comparison", comparison: "けど is casual/colloquial; が is formal/written." }
        ]
    },
    {
        slug: "けれども",
        level: 6,
        title: "けれども",
        meanings: ["But", "Although"],
        structure: { patterns: ["Phrase + けれども"] },
        details: { part_of_speech: "Particle", word_type: "Conjunctive Particle", register: "Formal" },
        about: "A more formal version of 'but'. Sounds softer or more descriptive than the direct 'が'.",
        fun_facts: ["Often carries a nuance of 'although' or setting the background carefully."],
        related: []
    },
    {
        slug: "ここ",
        level: 6,
        title: "ここ",
        meanings: ["Here", "This place"],
        structure: { patterns: ["ここ"] },
        details: { part_of_speech: "Noun", word_type: "Pronoun", register: "Standard" },
        about: "Identifies the place near the speaker. Part of the 'ko-so-a-do' system.",
        fun_facts: ["Focused purely on the stationary location; こっち focuses more on the direction."],
        related: []
    },
    {
        slug: "この",
        level: 6,
        title: "この",
        meanings: ["This"],
        structure: { patterns: ["この + Noun"] },
        details: { part_of_speech: "Fixed Adjective", word_type: "Independent Word", register: "Standard" },
        about: "A pre-noun demonstrative adjective used for things near the speaker. Never conjugates.",
        fun_facts: ["Always followed by a noun."],
        related: []
    },
    {
        slug: "これ",
        level: 6,
        title: "これ",
        meanings: ["This (thing)"],
        structure: { patterns: ["これ"] },
        details: { part_of_speech: "Noun", word_type: "Pronoun", register: "Standard" },
        about: "A pronoun referring to a thing near the speaker.",
        fun_facts: ["Used for things close either physically or emotionally."],
        related: []
    },
    {
        slug: "じゃない",
        level: 7,
        title: "じゃない",
        meanings: ["Is not", "Isn't"],
        structure: { patterns: ["Noun/［な］Adj + じゃない/ではない"] },
        details: { part_of_speech: "Verb", word_type: "Auxiliary Verb", register: "Standard" },
        about: "Casual negative form of the copula 'だ'. Used for nouns and な-Adjectives.",
        fun_facts: ["では is regularly contracted to じゃ in speech. Used as a tag question ('isn't it?') with a rising tone."],
        related: [
            { slug: "だ", type: "Antonym", comparison: "だ is 'is'; じゃない is 'is not'." },
            { slug: "るverb--ない", type: "Comparison", comparison: "じゃない is for nouns/な-adjectives; ない is for verbs." }
        ]
    },
    {
        slug: "じゃなかった",
        level: 7,
        title: "じゃなかった",
        meanings: ["Was not", "Wasn't"],
        structure: { patterns: ["Noun/［な］Adj + じゃなかった/ではなかった"] },
        details: { part_of_speech: "Verb", word_type: "Auxiliary Verb", register: "Standard" },
        about: "Casual past-negative form of the copula. Denotes that something was NOT a certain way in the past.",
        fun_facts: ["Polite forms include じゃありませんでした or ではありませんでした."],
        related: [
            { slug: "じゃない", type: "Tense", comparison: "じゃない is present negative; じゃなかった is past negative." }
        ]
    },
    {
        slug: "すぎる",
        level: 7,
        title: "すぎる (過(す)ぎる)",
        meanings: ["Too much", "To exceed"],
        structure: { patterns: ["Verb (stem) + すぎる", "［い］Adj (no い) + すぎる", "［な］Adj + すぎる"] },
        details: { part_of_speech: "Verb", word_type: "Independent Word", register: "Standard" },
        about: "Auxiliary verb meaning 'to go past' or 'to exceed a limit'. Attached to stems of verbs or adjectives.",
        fun_facts: ["It is a る-Verb itself (Ichidan). When using with 'いい' (good), the stem is 'よ' (よすぎる)."],
        related: []
    },
    {
        slug: "する",
        level: 7,
        title: "する (為(す)る)",
        meanings: ["To do"],
        structure: { patterns: ["する", "します (Polite)", "した (Past)", "しない (Negative)"] },
        details: { part_of_speech: "Verb", word_type: "Independent Word", register: "Standard" },
        about: "One of the two irregular verbs. Very versatile, turning nouns into verbs (e.g., 勉強する).",
        fun_facts: ["A 'Sa-column irregular' verb: [shi]masu, [su]ru, [se]yo, [sa]seru. High degree of sound change."],
        related: [
            { slug: "いたす", type: "Humble", comparison: "いたus is the humble version of する." },
            { slug: "なさる", type: "Honorific", comparison: "なさる is the honorific version of する." }
        ]
    },
    {
        slug: "そこ",
        level: 7,
        title: "そこ",
        meanings: ["There", "That place"],
        structure: { patterns: ["そこ"] },
        details: { part_of_speech: "Noun", word_type: "Pronoun", register: "Standard" },
        about: "Identifies a place near the listener, or a place previously mentioned in conversation.",
        fun_facts: ["Part of 'ko-so-a-do'. Used for mental 'locations' in a story."],
        related: []
    }
];

async function main() {
    for (const item of n5_batch_3) {
        console.log(`Processing: ${item.slug}`);
        const { data: ku } = await supabase.from('knowledge_units').upsert({
            slug: item.slug,
            type: 'grammar',
            level: item.level,
            character: item.title,
            meaning: item.meanings[0],
            search_key: item.title.toLowerCase()
        }, { onConflict: 'slug' }).select('id').single();

        if (!ku) continue;

        await supabase.from('ku_grammar').upsert({
            ku_id: ku.id,
            structure: item.structure,
            details: item.details.part_of_speech,
            content_blob: {
                about_description: item.about,
                fun_facts: item.fun_facts,
                details_expanded: item.details
            }
        }, { onConflict: 'ku_id' });

        if (item.related) {
            for (const rel of item.related) {
                const { data: relKu } = await supabase.from('knowledge_units').select('id').eq('slug', rel.slug).single();
                if (relKu) {
                    await supabase.from('grammar_relations').upsert({
                        grammar_id: ku.id,
                        related_grammar_id: relKu.id,
                        type: rel.type.toLowerCase(),
                        comparison_note: rel.comparison
                    }, { onConflict: 'grammar_id,related_grammar_id,type' });
                }
            }
        }
    }
    console.log('Batch 3 complete!');
}

main();
