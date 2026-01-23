
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

const n5_batch_1 = [
    {
        slug: "adjective-て-b",
        level: 1,
        title: "～て (Qualities and States)",
        meanings: ["And...", "Both and (Conjunctive)"],
        structure: { patterns: ["［い］Adjective［い］ + く + て", "［な］Adjective + で + Phrase", "Noun + で + Phrase"] },
        details: { part_of_speech: "Particle", word_type: "Conjunctive Particle", register: "Standard" },
        about: "The て form of an い-Adjective, or で form of a noun (or な-Adjective) is exactly the same as the て form of a verb, in that it carries the meaning of 'and', and is used for linking.",
        fun_facts: ["で is actually a form of だ that is used for conjugation. It is the same で as the one that is used in the formal version of である."],
        related: [
            { slug: "adjective-て-noun-で", type: "Similar", comparison: "Both patterns involve connecting an adjective or noun phrase using the て form." },
            { slug: "し-し", type: "Contrast", comparison: "し～し lists multiple reasons and implies a conclusion, whereas て just connects." }
        ]
    },
    {
        slug: "adjective-て-noun-で",
        level: 1,
        title: "～て (Adjectives and Nouns)",
        meanings: ["And... (Conjunctive)"],
        structure: { patterns: ["［い］Adjective［い］ + く + て", "［な］Adjective + で", "Noun + で"] },
        details: { part_of_speech: "Adjective + Conjunctions", word_type: "Particle / Auxiliary Verb", register: "Standard" },
        about: "The て form allow us to list multiple qualities/traits of something. For い-Adjectives, change the last い to く and add て. For nouns and な-Adjectives, add で.",
        fun_facts: ["て is a conjunction particle, while で is a form of だ."],
        related: []
    },
    {
        slug: "adjective-の-は",
        level: 1,
        title: "(Adjective) + のは",
        meanings: ["The 'one' that..."],
        structure: { patterns: ["［な］Adjective + な + の + は", "［い］Adjective + の + は"] },
        details: { part_of_speech: "Expression", word_type: "Case Marking Particle", register: "Standard" },
        about: "の replaces a noun that has already been mentioned. It is similar to 'the one that (A)' in English.",
        fun_facts: ["の may be used more than once in the same sentence, referring to the same noun."],
        related: [
            { slug: "particle-の", type: "Related", comparison: "Particle + の describes a noun (like 'letter to teacher'), while Adjective + の replaces a noun." }
        ]
    },
    {
        slug: "noun-まで",
        level: 1,
        title: "Noun + まで",
        meanings: ["Until", "Till", "To"],
        structure: { patterns: ["Ending Point + まで", "Noun + まで"] },
        details: { part_of_speech: "Noun", word_type: "Adverbial Particle", register: "Standard" },
        about: "まで roughly means 'as far as'. It signifies an end point in time or location.",
        fun_facts: ["When used with a place, it functions similarly to に, meaning 'to' but not further."],
        related: [
            { slug: "v-まで", type: "Synonym", comparison: "Verb + まで means 'until A happens', while Noun + まで is for time points or locations." }
        ]
    },
    {
        slug: "verb-て",
        level: 1,
        title: "～て (Conjunction)",
        meanings: ["And", "Then (Linking events)"],
        structure: { patterns: ["Verb［て］"] },
        details: { part_of_speech: "Verb", word_type: "Conjunctive Particle", register: "Standard" },
        about: "て is a very important conjunction particle. When partnered with a verb, it describes actions that happen in sequence.",
        fun_facts: ["If the dictionary form finishes in ぐ, ぬ, ぶ, or む, then で will be used."],
        related: []
    },
    {
        slug: "verb-て-b",
        level: 2,
        title: "～て (Sequence)",
        meanings: ["And", "And then", "After that (sequence)"],
        structure: { patterns: ["Verb［て］+ (Action) Phrase"] },
        details: { part_of_speech: "Particle", word_type: "Conjunctive Particle", register: "Standard" },
        about: "Lists sequences of events that happen one after another.",
        fun_facts: ["Construction is strictly for sequential events. Use たり～たり for non-sequential lists."],
        related: []
    },
    {
        slug: "verb-てもいい",
        level: 2,
        title: "～てもいい",
        meanings: ["It's okay to", "It's alright to", "Can/may"],
        structure: { patterns: ["Verb［て］+ も + いい"] },
        details: { part_of_speech: "Expression", word_type: "Adjective", register: "Standard" },
        about: "Used to express that something is 'okay' or to ask for permission.",
        fun_facts: ["Removing the 'も' makes it more direct/casual."],
        related: [
            { slug: "てもかまわない", type: "Synonym", comparison: "てもいい is basic/everyday, while てもかまわない is more formal/professional." }
        ]
    },
    {
        slug: "verb-にいく",
        level: 2,
        title: "～に行(い)く",
        meanings: ["To go ~", "To go in order to ~"],
        structure: { patterns: ["Verb［stem］+ に + 行(い)く"] },
        details: { part_of_speech: "Expression", word_type: "Verb", register: "Standard" },
        about: "Used when someone is going somewhere for the purpose of doing (A).",
        fun_facts: ["If you have already 'gone' somewhere, use '(A) に来た' while at the location."],
        related: [
            { slug: "ていく", type: "Contrast", comparison: "にいく is for purpose (go to eat), while ていく is for sequence (eat then go)." }
        ]
    },
    {
        slug: "v-まで",
        level: 2,
        title: "Verb + まで",
        meanings: ["Until (something) happens"],
        structure: { patterns: ["Verb + まで"] },
        details: { part_of_speech: "Noun", word_type: "Adverbial Particle", register: "Standard" },
        about: "Means 'until the point of (A)'. Used with plain-form verbs.",
        fun_facts: ["Cannot be used with verbs in past tense. Sequence is handled by later verbs in the sentence."],
        related: []
    },
    {
        slug: "verb-non-past",
        level: 2,
        title: "Verb (Non-Past)",
        meanings: ["(Non-past)"],
        structure: { patterns: ["Verb [Dictionary Form]"] },
        details: { part_of_speech: "Verb", word_type: "Dictionary Form", register: "Standard" },
        about: "The non-past form handles general facts, habits, and future events.",
        fun_facts: ["In Japanese, future tense doesn't have a separate conjugation from the present 'dictionary' form."],
        related: []
    }
];

async function main() {
    for (const item of n5_batch_1) {
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
    console.log('Batch 1 complete!');
}

main();
