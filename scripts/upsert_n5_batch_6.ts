
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

const n5_batch_6 = [
    {
        slug: "に",
        level: 9,
        title: "に",
        meanings: ["To", "At", "In", "For", "On"],
        structure: { patterns: ["Noun + に"] },
        details: { part_of_speech: "Particle", word_type: "Case Marking Particle", register: "Standard" },
        about: "A versatile particle marking direction, destination, target of an action, or place of existence. Think of it as the 'end-point' marker.",
        fun_facts: ["Verbs like 'sumu' (live) use 'ni' because the act of living is completed at the destination."],
        related: [
            { slug: "で", type: "Contrast", comparison: "に marks destination/existence; で marks action location." }
        ]
    },
    {
        slug: "にする",
        level: 9,
        title: "にする",
        meanings: ["To decide on", "To choose", "To make it (A)"],
        structure: { patterns: ["Noun + に + する"] },
        details: { part_of_speech: "Expression", word_type: "Verb", register: "Standard" },
        about: "Used when making a choice or decision among options. Implies the speaker has direct control.",
        fun_facts: ["Literally 'I'll do (A)'. Used frequently when ordering food in restaurants."],
        related: []
    },
    {
        slug: "ね",
        level: 9,
        title: "ね",
        meanings: ["Right?", "Isn't it?"],
        structure: { patterns: ["Sentence + ね"] },
        details: { part_of_speech: "Particle", word_type: "Sentence Ending Particle", register: "Standard" },
        about: "Used at the end of a sentence to seek agreement or confirmation from the listener.",
        fun_facts: ["Focuses on shared knowledge or opinion. 'Yo' focuses on the speaker's new info."],
        related: []
    },
    {
        slug: "の-noun-ommission",
        level: 9,
        title: "の (Noun omission)",
        meanings: ["Mine", "Yours", "The one of..."],
        structure: { patterns: ["Noun + の"] },
        details: { part_of_speech: "Particle", word_type: "Case Marking Particle", register: "Standard" },
        about: "Used to refer back to a previously mentioned noun without repeating it. Functions like 'mine' or 'the (A) one'.",
        fun_facts: ["Japanese avoids redundancy; if the noun is understood, just end with 'no'."],
        related: [
            { slug: "の", type: "Comparison", comparison: "This is the same 'no' particle, just with the noun omitted." }
        ]
    },
    {
        slug: "の",
        level: 9,
        title: "の (Possessive)",
        meanings: ["Possession", "Relationship marker"],
        structure: { patterns: ["Noun (A) + の + Noun (B)"] },
        details: { part_of_speech: "Particle", word_type: "Case Marking Particle", register: "Standard" },
        about: "Indicates that Noun (B) belongs to or is an attribute of Noun (A).",
        fun_facts: ["Broader than English 's'. Can show origin, category, or type."],
        related: []
    },
    {
        slug: "のは",
        level: 9,
        title: "のは・のが",
        meanings: ["Nominalizer", "That which...", "The one who..."],
        structure: { patterns: ["Verb (plain) + のは/のが"] },
        details: { part_of_speech: "Particle", word_type: "Case Marking Particle", register: "Standard" },
        about: "Turns a verb or phrase into a noun so it can be used with particles like は and が.",
        fun_facts: ["Enables you to treat actions as things (e.g., 'Eating a lot is...' = 'Taberu no wa...')."],
        related: []
    },
    {
        slug: "のがじょうず",
        level: 9,
        title: "のがじょうず",
        meanings: ["To be good at", "Proficient"],
        structure: { patterns: ["Verb (plain) + のがじょうずだ"] },
        details: { part_of_speech: "Expression", word_type: "Adjectival Noun", register: "Standard" },
        about: "Used to express that someone is skilled at a particular activity.",
        fun_facts: ["In Japan, it's rare to use 'jouzu' to describe yourself; it might sound boastful."],
        related: [
            { slug: "のがへた", type: "Antonym", comparison: "jouzu is 'good at'; heta is 'bad at'." }
        ]
    },
    {
        slug: "のがすき",
        level: 9,
        title: "のがすき",
        meanings: ["Like doing", "Love doing"],
        structure: { patterns: ["Verb (plain) + のがすきだ"] },
        details: { part_of_speech: "Expression", word_type: "Adjectival Noun", register: "Standard" },
        about: "Used to express that you like or enjoy performing a certain action.",
        fun_facts: ["Works with both affirmative 'suki' and its past tense 'suki datta'."],
        related: []
    },
    {
        slug: "のがへた",
        level: 9,
        title: "のがへた",
        meanings: ["To be bad at", "Poor at"],
        structure: { patterns: ["Verb (plain) + のがへただ"] },
        details: { part_of_speech: "Expression", word_type: "Adjectival Noun", register: "Standard" },
        about: "Used to express that someone is unskilled or poor at a particular activity.",
        fun_facts: ["A safe and humble way to describe your own lack of skill."],
        related: []
    },
    {
        slug: "ので",
        level: 9,
        title: "ので",
        meanings: ["Because", "So", "Since"],
        structure: { patterns: ["Verb/Adj + ので", "Noun/［な］Adj + な + ので"] },
        details: { part_of_speech: "Particle", word_type: "Conjunctive Particle", register: "Standard" },
        about: "Identifies a cause or reason objectively. Sounds more polite and softer than 'kara'.",
        fun_facts: ["Often contracted to 'n de' in casual speech. Can be used with polite 'masu' forms too."],
        related: [
            { slug: "から", type: "Comparison", comparison: "node is objective/polite; kara is subjective/direct." }
        ]
    },
    {
        slug: "のなかで-がいちばん",
        level: 9,
        title: "のなかで～がいちばん",
        meanings: ["Among ~, ~ is the most"],
        structure: { patterns: ["(Group) + のなかで + (Item) + がいちばん + Adjective"] },
        details: { part_of_speech: "Expression", word_type: "Expression", register: "Standard" },
        about: "Used to pick a superlative (the best/most) from a group or category of 3 or more.",
        fun_facts: ["'Naka' means inside/middle; literally 'In the middle of (group), (item) is #1'."],
        related: []
    },
    {
        slug: "は",
        level: 9,
        title: "は",
        meanings: ["As for...", "Topic marker"],
        structure: { patterns: ["Noun + は"] },
        details: { part_of_speech: "Particle", word_type: "Linking Particle", register: "Standard" },
        about: "Marks the topic of the sentence. Pronounced 'wa'.",
        fun_facts: ["Sets the stage for the whole sentence. Often used for contrast (A is this, but what about B?)."],
        related: [
            { slug: "が", type: "Contrast", comparison: "wa marks topic (background); ga marks subject (new/focused info)." }
        ]
    },
    {
        slug: "へ",
        level: 9,
        title: "へ",
        meanings: ["To", "Toward"],
        structure: { patterns: ["Noun (Place) + へ"] },
        details: { part_of_speech: "Particle", word_type: "Case Marking Particle", register: "Standard" },
        about: "Directional particle indicating movement toward a place. Focuses more on the path/journey.",
        fun_facts: ["Pronounced 'e'. Use in 'Welcome to...' (e yokoso) because it acknowledges the journey."],
        related: [
            { slug: "に", type: "Comparison", comparison: "he focuses on direction; ni focuses on the destination point." }
        ]
    },
    {
        slug: "へいく",
        level: 9,
        title: "へいく",
        meanings: ["To go to", "To head to"],
        structure: { patterns: ["Place + へいく"] },
        details: { part_of_speech: "Expression", word_type: "Verb", register: "Standard" },
        about: "A common construction used when describing a place that someone is heading towards.",
        fun_facts: ["While 'ni iku' is more common, 'he iku' sounds a bit more poetic or focuses on heading there."],
        related: []
    },
    {
        slug: "まえに",
        level: 9,
        title: "まえに",
        meanings: ["Before", "In front of"],
        structure: { patterns: ["Verb (plain) + まえに", "Noun + の + まえに"] },
        details: { part_of_speech: "Expression", word_type: "Case Marking Particle", register: "Standard" },
        about: "Used to describe things happening 'before' in time or 'in front of' in space.",
        fun_facts: ["Always use dictionary form for verbs before 'まえに', even if the main action is past tense."],
        related: [
            { slug: "あとで", type: "Antonym", comparison: "maeni is 'before'; atode is 'after'." }
        ]
    },
    {
        slug: "ましょう",
        level: 9,
        title: "ましょう",
        meanings: ["Let's", "Shall we"],
        structure: { patterns: ["Verb (stem) + ましょう"] },
        details: { part_of_speech: "Auxiliary Verb", word_type: "Dependent Word", register: "Polite" },
        about: "Polite volitional form used to suggest or invite someone to do something together.",
        fun_facts: ["Can also be used as a polite declaration of intent ('I shall do it')."],
        related: [
            { slug: "ましょうか", type: "Comparison", comparison: "mashou is assertive (let's); mashou ka is softer (shall we?)." }
        ]
    },
    {
        slug: "polite-verb-endings",
        level: 10,
        title: "ます",
        meanings: ["Polite ending"],
        structure: { patterns: ["Verb (stem) + ます"] },
        details: { part_of_speech: "Auxiliary Verb", word_type: "Dependent Word", register: "Polite" },
        about: "The standard auxiliary verb used to make verbs polite. Equivalent to 'desu' for nouns/adjectives.",
        fun_facts: ["Thought to come from 'mairasu' (to humbly do). Change 'masu' to 'mashita' for past tense."],
        related: []
    },
    {
        slug: "ませんか",
        level: 10,
        title: "ませんか",
        meanings: ["Won't you?", "Why don't we?"],
        structure: { patterns: ["Verb (stem) + ませんか"] },
        details: { part_of_speech: "Expression", word_type: "Sentence Ending Particle", register: "Polite" },
        about: "A polite way to invite someone to do something. Sounds softer and more inviting than 'mashou'.",
        fun_facts: ["Literally 'will you not?'. It gives the listener an easy way to decline respectfully."],
        related: [
            { slug: "ましょう", type: "Comparison", comparison: "masen ka is a request/invitation; mashou is a suggestion." }
        ]
    },
    {
        slug: "まだ",
        level: 10,
        title: "まだ",
        meanings: ["Still", "Not yet"],
        structure: { patterns: ["まだ + Phrase"] },
        details: { part_of_speech: "Adverb", word_type: "Independent Word", register: "Standard" },
        about: "Expresses a continuing state. 'Still' with positive verbs; 'not yet' with negative verbs.",
        fun_facts: ["Often doubled as 'mada mada' to mean 'not yet/far from it' (very humble)."],
        related: [
            { slug: "もう", type: "Antonym", comparison: "mada is 'still/not yet'; mou is 'already/no longer'." }
        ]
    },
    {
        slug: "まだ-ていません",
        level: 10,
        title: "まだ～ていません",
        meanings: ["Still haven't done (something)"],
        structure: { patterns: ["まだ + Verb［て］+ いません"] },
        details: { part_of_speech: "Expression", word_type: "Auxiliary Verb", register: "Standard" },
        about: "The negative state of まだ. Expresses that an expected action has not yet occurred.",
        fun_facts: ["Combines adverb 'mada' with 'te imasen' (not currently in state)."],
        related: []
    }
];

async function main() {
    for (const item of n5_batch_6) {
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
    console.log('Batch 6 complete!');
}

main();
