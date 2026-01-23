
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

const n5_batch_2 = [
    {
        slug: "verb-た-noun",
        level: 2,
        title: "～た + (Noun)",
        meanings: ["Verb modified noun", "Relative clause"],
        structure: { patterns: ["Verb［た］+ Noun", "Verb［ている］+ Noun"] },
        details: { part_of_speech: "Expression", word_type: "Noun", register: "Standard" },
        about: "In Japanese, relative clauses are created by attaching the plain-past (た) or continuous (ている) form of a verb directly to a noun. They replace words like 'that' or 'which' in English.",
        fun_facts: ["Only verbs in short (plain) form can modify nouns. Do not use polite -ます forms."],
        related: []
    },
    {
        slug: "あげる",
        level: 3,
        title: "あげる",
        meanings: ["To give (away)", "To present", "To provide"],
        structure: { patterns: ["Giverは Recipientに Objectをあげる"] },
        details: { part_of_speech: "Verb", word_type: "Independent Word", register: "Standard" },
        about: "あげる originally means 'to raise' and is the standard polite way to say 'to give'. The giver is marked with は/が, and the recipient with に.",
        fun_facts: ["やる is the casual equivalent, but can sound rough. あげる is the natural standard."],
        related: [
            { slug: "くれる", type: "Similar", comparison: "あげる is giving away; くれる is giving to the speaker group." },
            { slug: "もらう", type: "Contrast", comparison: "あげる is from the giver's perspective (give); もらう is from the receiver's perspective (receive)." }
        ]
    },
    {
        slug: "あそこ",
        level: 3,
        title: "あそこ",
        meanings: ["Over there"],
        structure: { patterns: ["あそこ"] },
        details: { part_of_speech: "Noun", word_type: "Pronoun", register: "Standard" },
        about: "Identifies a place separated from both the speaker and listener. Can be used for physical or emotional/abstract locations.",
        fun_facts: ["Don't confuse with あっち, which focuses on direction."],
        related: []
    },
    {
        slug: "あの",
        level: 3,
        title: "あの",
        meanings: ["That (over there)"],
        structure: { patterns: ["あの + Noun"] },
        details: { part_of_speech: "Noun", word_type: "Pronoun", register: "Standard" },
        about: "A pre-noun adjectival that never conjugates. Refers to a thing away from both speaker and listener.",
        fun_facts: ["Always appears before a noun."],
        related: []
    },
    {
        slug: "あれ",
        level: 3,
        title: "あれ",
        meanings: ["That (over there)"],
        structure: { patterns: ["あれ"] },
        details: { part_of_speech: "Noun", word_type: "Pronoun", register: "Standard" },
        about: "A pronoun used to highlight things away from both speaker and listener.",
        fun_facts: ["Pronounced 'are' but refers to something far away."],
        related: []
    },
    {
        slug: "past-tense-い-adjectives",
        level: 3,
        title: "い-Adjective (Past)",
        meanings: ["Was", "Were (Past tense)"],
        structure: { patterns: ["［い］Adjective + かった"] },
        details: { part_of_speech: "Adjective", word_type: "Auxiliary Verb", register: "Standard" },
        about: "Formed by removing the 'い' and adding 'かった'. Equivalent to 'was' in English.",
        fun_facts: ["Adding です after かった is the standard polite past form, though historically debated by grammarians."],
        related: []
    },
    {
        slug: "い-adjective-predicate",
        level: 3,
        title: "い-Adjective (Predicate)",
        meanings: ["Predicate adjectival"],
        structure: { patterns: ["Adjective (Predicate)"] },
        details: { part_of_speech: "Adjective", word_type: "Independent Word", register: "Standard" },
        about: "い-Adjectives can stand alone as a predicate. We guess the subject ('it') from context.",
        fun_facts: ["All い-Adjectives are of Japanese origin (Wago)."],
        related: []
    },
    {
        slug: "い-adjective-noun",
        level: 3,
        title: "い-Adjective + Noun",
        meanings: ["Describing a noun"],
        structure: { patterns: ["［い］Adjective + Noun"] },
        details: { part_of_speech: "Expression", word_type: "Independent Word", register: "Standard" },
        about: "い-Adjectives are attached directly to nouns in their dictionary form.",
        fun_facts: ["い-Adjectives have the い outside the kanji. Exceptional な-Adjectives like きらい have the い outside but are still な type."],
        related: [
            { slug: "な-adjective-noun", type: "Comparison", comparison: "い type connects directly; な type uses the 'な' particle." }
        ]
    },
    {
        slug: "い-Adjective-くなかった",
        level: 3,
        title: "い-Adjective くなかった",
        meanings: ["Was not", "Wasn't"],
        structure: { patterns: ["［い］Adjective［く］+ なかった"] },
        details: { part_of_speech: "Adjective", word_type: "Auxiliary Verb", register: "Standard" },
        about: "Negative past form: remove final 'い', add 'く', then 'なかった'.",
        fun_facts: ["The semi-polite form adds 'です' after 'なかった'."],
        related: []
    },
    {
        slug: "い-adjectives",
        level: 4,
        title: "い-Adjectives",
        meanings: ["Adjectives ending in い"],
        structure: { patterns: ["い-Adjective"] },
        details: { part_of_speech: "Adjective", word_type: "Independent Word", register: "Standard" },
        about: "Standard Japanese adjectives ending in い. Used to describe nouns or states.",
        fun_facts: ["Never follow an い-Adjective with だ. Use です for politeness instead."],
        related: []
    },
    {
        slug: "negative-い-adjectives",
        level: 4,
        title: "い-Adjectives くない",
        meanings: ["Not (Adjective)"],
        structure: { patterns: ["［い］Adjective［く］+ ない"] },
        details: { part_of_speech: "Adjective", word_type: "Auxiliary Verb", register: "Standard" },
        about: "Negative form created by changing 'い' to 'く' and adding 'ない'.",
        fun_facts: ["ない is itself an い-Adjective. You can't use 'だ' after it, but 'です' is okay."],
        related: [
            { slug: "じゃない", type: "Comparison", comparison: "い-Adjectives use くない; Nouns and な-Adjectives use じゃない." }
        ]
    },
    {
        slug: "いい",
        level: 4,
        title: "いい",
        meanings: ["Good"],
        structure: { patterns: ["いい (Non-Past)", "よくない (Negative)", "よかった (Past)", "よくなかった (Neg-Past)"] },
        details: { part_of_speech: "Adjective", word_type: "Independent Word", register: "Standard" },
        about: "Irregular adjective. Conjugates starting with 'よ' for everything except plain non-past 'いい'.",
        fun_facts: ["良(い) can be read as よい, which sounds more formal/old-fashioned."],
        related: []
    },
    {
        slug: "う-Verbs",
        level: 4,
        title: "う-Verb (Dictionary)",
        meanings: ["Dictionary form verbs"],
        structure: { patterns: ["Verb ending in う sound"] },
        details: { part_of_speech: "Verb", word_type: "Independent Word", register: "Standard" },
        about: "Also called Godan (five-level) verbs. Their base form always ends in an 'u' sound.",
        fun_facts: ["Godan verbs use all 5 vowel sounds in their column for various conjugations."],
        related: []
    },
    {
        slug: "うverb--ない",
        level: 4,
        title: "う-Verb (Negative)",
        meanings: ["Does not", "Will not"],
        structure: { patterns: ["Verb (あ-sound) + ない", "Verb (い-sound) + ません"] },
        details: { part_of_speech: "Verb", word_type: "Auxiliary Verb", register: "Standard" },
        about: "To make the negative, change the final 'u' sound to 'a' sound and add 'ない'.",
        fun_facts: ["Verbs ending in plain う (like 買う) change to わ, not あ (買う → 買わない)."],
        related: []
    },
    {
        slug: "う-verb-neg-past",
        level: 4,
        title: "う-Verb (Negative-Past)",
        meanings: ["Did not", "Was not"],
        structure: { patterns: ["Verb (あ-sound) + なかった", "Verb (い-sound) + ませんでした"] },
        details: { part_of_speech: "Verb", word_type: "Auxiliary Verb", register: "Standard" },
        about: "Used to convey that something did not happen in the past.",
        fun_facts: ["'ある' is an exception: casual past negative is just 'なかった', not 'あらなかった'."],
        related: []
    },
    {
        slug: "う-verb-past",
        level: 4,
        title: "う-Verb (Past)",
        meanings: ["Did", "Was"],
        structure: { patterns: ["Verb + った/いた/いだ/んだ/した", "Verb (い-sound) + ました"] },
        details: { part_of_speech: "Verb", word_type: "Auxiliary Verb", register: "Standard" },
        about: "Past tense used for completed actions or past states. Changes kana to った, んだ, etc. for casual, or -ました for polite.",
        fun_facts: ["Sound changes like った are for ease of speech and evolved over history."],
        related: []
    },
    {
        slug: "か-or",
        level: 4,
        title: "か (Or)",
        meanings: ["Or"],
        structure: { patterns: ["A か B か"] },
        details: { part_of_speech: "Particle", word_type: "Adverbial Particle", register: "Standard" },
        about: "Translates to 'or', presenting possibilities. Functionally identical to the question marker か.",
        fun_facts: ["Using です or ます after か changes the nuance from 'options' to 'formal question'."],
        related: [
            { slug: "それとも", type: "Comparison", comparison: "か follows nouns; それとも starts a sentence." }
        ]
    },
    {
        slug: "か",
        level: 4,
        title: "か",
        meanings: ["Question marker"],
        structure: { patterns: ["Phrase + か"] },
        details: { part_of_speech: "Particle", word_type: "Sentence Ending Particle", register: "Standard" },
        about: "The standard question particle. Can also express uncertainty.",
        fun_facts: ["In casual speech, using か after a plain verb can sometimes sound direct or even rude depending on tone."],
        related: [
            { slug: "よ", type: "Antonym", comparison: "か asks for info; よ provides info/emphasis." }
        ]
    },
    {
        slug: "から-because",
        level: 4,
        title: "から (Because)",
        meanings: ["Because", "Since"],
        structure: { patterns: ["Verb/Adj + から", "Noun/な-Adj + だから"] },
        details: { part_of_speech: "Particle", word_type: "Case Marking Particle", register: "Standard" },
        about: "Expresses reason or cause: 'Because of (A), (B)'.",
        fun_facts: ["Think of it as 'From (reason)' reaching a conclusion."],
        related: []
    },
    {
        slug: "から",
        level: 5,
        title: "から (From)",
        meanings: ["From"],
        structure: { patterns: ["Starting Point + から"] },
        details: { part_of_speech: "Particle", word_type: "Case Marking Particle", register: "Standard" },
        about: "Identifies a starting location or point in time.",
        fun_facts: ["When used after nouns to mean 'from', it does NOT use だ. (Noun + から)."],
        related: [
            { slug: "てから", type: "Related", comparison: "てから implies 'after doing A'; From-から is just starting point." }
        ]
    }
];

async function main() {
    for (const item of n5_batch_2) {
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
    console.log('Batch 2 complete!');
}

main();
