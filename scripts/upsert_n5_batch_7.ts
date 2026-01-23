
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

const n5_batch_7 = [
    {
        slug: "や",
        level: 10,
        title: "や",
        meanings: ["Things like", "And the like"],
        structure: { patterns: ["Noun + や + Noun"] },
        details: { part_of_speech: "Particle", word_type: "Adverbial Particle", register: "Standard" },
        about: "Used to list examples from a larger set. Implies that the list is not exhaustive (unlike 'to').",
        fun_facts: ["Imagine a fruit bowl; 'A to B' means only A and B are there. 'A ya B' means A, B, and maybe others."],
        related: [
            { slug: "と-and", type: "Comparison", comparison: "to is exhaustive (complete list); ya is non-exhaustive (examples)." }
        ]
    },
    {
        slug: "よ",
        level: 10,
        title: "よ",
        meanings: ["Emphasis", "New info marker"],
        structure: { patterns: ["Sentence + よ"] },
        details: { part_of_speech: "Particle", word_type: "Sentence Ending Particle", register: "Standard" },
        about: "Used to convey new information to the listener or to add emphasis to a statement.",
        fun_facts: ["Sounds a bit assertive. Often used like 'you know' or 'I tell you!' in English."],
        related: []
    },
    {
        slug: "より-のほうが",
        level: 10,
        title: "より～のほうが",
        meanings: ["To be more ~ than ~"],
        structure: { patterns: ["Noun (A) + より + Noun (B) + のほうが + Adj"] },
        details: { part_of_speech: "Expression", word_type: "Expression", register: "Standard" },
        about: "A comparison structure. '(B) is more (Adj) than (A)'.",
        fun_facts: ["Yori means 'than'. The word right before yori is the 'lesser' one in the comparison."],
        related: []
    },
    {
        slug: "る-Verbs",
        level: 10,
        title: "る-Verb (Dictionary)",
        meanings: ["Verb (Plain form)"],
        structure: { patterns: ["Verb (る form)"] },
        details: { part_of_speech: "Verb", word_type: "Ichidan Verb", register: "Standard" },
        about: "The dictionary form of Ichidan verbs. To conjugate, you usually just drop or replace the 'る'.",
        fun_facts: ["Also called 'Group 2' verbs. They are the easiest to conjugate!"],
        related: []
    },
    {
        slug: "るverb-ない",
        level: 10,
        title: "る-Verb (Negative)",
        meanings: ["Will/Does not"],
        structure: { patterns: ["Verb (stem) + ない"] },
        details: { part_of_speech: "Verb", word_type: "Ichidan Verb", register: "Standard" },
        about: "The casual negative form. For Ichidan verbs, remove 'る' and add 'ない'.",
        fun_facts: ["Works exactly like the auxiliary verb 'nai' but attached to a verb stem."],
        related: []
    },
    {
        slug: "る-verb-neg-past",
        level: 10,
        title: "る-Verb (Negative-Past)",
        meanings: ["Did not"],
        structure: { patterns: ["Verb (stem) + なかった"] },
        details: { part_of_speech: "Verb", word_type: "Ichidan Verb", register: "Standard" },
        about: "The casual negative past form. Conjugate to 'nai' first, then change 'nai' to 'nakatta'.",
        fun_facts: ["Standard past-negative conjugation for all Ichidan verbs."],
        related: []
    },
    {
        slug: "る-verb-past",
        level: 10,
        title: "る-Verb (Past)",
        meanings: ["Did (something)"],
        structure: { patterns: ["Verb (stem) + た"] },
        details: { part_of_speech: "Verb", word_type: "Ichidan Verb", register: "Standard" },
        about: "The casual past tense form. For Ichidan verbs, remove 'る' and add 'た'.",
        fun_facts: ["Unlike Godan verbs, Ichidan verbs don't have messy sound changes (on-bin) in the past tense."],
        related: []
    },
    {
        slug: "を",
        level: 10,
        title: "を",
        meanings: ["Object marker"],
        structure: { patterns: ["Noun + を + Verb"] },
        details: { part_of_speech: "Particle", word_type: "Case Marking Particle", register: "Standard" },
        about: "Marks the direct object of an action. The thing that receives the action.",
        fun_facts: ["Pronounced 'o'. In some texts, it's called the 'accusative' particle."],
        related: []
    },
    {
        slug: "すき",
        level: 10,
        title: "好き",
        meanings: ["Like", "Fond of"],
        structure: { patterns: ["Noun + が + すきだ/です"] },
        details: { part_of_speech: "Adjective", word_type: "Adjectival Noun", register: "Standard" },
        about: "A な-Adjective used to express what you like. The item liked is marked with 'ga'.",
        fun_facts: ["Be careful; it can mean romantic interest when used about people!"],
        related: []
    },
    {
        slug: "だれ",
        level: 10,
        title: "誰",
        meanings: ["Who"],
        structure: { patterns: ["だれ"] },
        details: { part_of_speech: "Noun", word_type: "Pronoun", register: "Standard" },
        about: "Interrogative pronoun used to ask about a person's identity.",
        fun_facts: ["Part of the 'wh-word' family. Becomes 'dareka' (someone) or 'daremo' (no one) with particles."],
        related: []
    },
    {
        slug: "誰か-どこか-誰も-どこも",
        level: 10,
        title: "誰か・どこか・誰も・どこも",
        meanings: ["Someone / Somewhere / No one / Nowhere"],
        structure: { patterns: ["WH-Word + か", "WH-Word + も"] },
        details: { part_of_speech: "Pronoun", word_type: "Adverbial Particle", register: "Standard" },
        about: "Using question words with 'ka' creates indefinite words (someone), while 'mo' with a negative verb creates 'no one'.",
        fun_facts: ["か marks positive uncertainty; も marks inclusive negation (in negative sentences)."],
        related: []
    },
    {
        slug: "にする-くなる",
        level: 10,
        title: "～になる・～くなる",
        meanings: ["To become"],
        structure: { patterns: ["Noun/［な］Adj + になる", "［い］Adj + くなる"] },
        details: { part_of_speech: "Expression", word_type: "Verb", register: "Standard" },
        about: "Used to show a change in state or quality. Literally 'becomes (A)'.",
        fun_facts: ["Uses the 'ni' particle for nouns/na-adj, but changes 'i' to 'ku' for i-adjectives."],
        related: []
    },
    {
        slug: "ましょうか",
        level: 10,
        title: "～ましょうか",
        meanings: ["Shall we", "Shall I"],
        structure: { patterns: ["Verb (stem) + ましょうか"] },
        details: { part_of_speech: "Expression", word_type: "Auxiliary Verb", register: "Polite" },
        about: "A polite suggestion or question. Sounds softer and more inquisitive than just 'mashou'.",
        fun_facts: ["Used to offer help ('Shall I do it?') or invite others ('Shall we eat?')."],
        related: [
            { slug: "ましょう", type: "Comparison", comparison: "mashou is assertive (let's); mashou ka is softer/interrogative." }
        ]
    },
    {
        slug: "-んです-のです",
        level: 10,
        title: "～んです・のです",
        meanings: ["Explanatory", "The fact is"],
        structure: { patterns: ["Verb/Adj + んです/のです", "Noun/［な］Adj + な + んです/のです"] },
        details: { part_of_speech: "Expression", word_type: "Auxiliary Verb", register: "Standard" },
        about: "The famous 'explanatory form'. Used when providing context, explanation, or emphasis.",
        fun_facts: ["'n desu' is common in speech; 'no desu' is slightly more formal. Always used in questions like 'Why?'."],
        related: []
    },
    {
        slug: "causative-passive",
        level: 11,
        title: "Causative-Passive",
        meanings: ["To be made to do something"],
        structure: { patterns: ["Verb (Causative-Passive form)"] },
        details: { part_of_speech: "Voice", word_type: "Auxiliary Verb", register: "Standard" },
        about: "Expresses that the subject was forced or made to do an action by someone else.",
        fun_facts: ["Typically used for things you didn't want to do, like 'I was made to clean my room'."],
        related: []
    },
    {
        slug: "number-しか-ない",
        level: 11,
        title: "Number + しか〜ない",
        meanings: ["Only", "No more than"],
        structure: { patterns: ["Number + しか + Verb (negative)"] },
        details: { part_of_speech: "Expression", word_type: "Expression", register: "Standard" },
        about: "Emphasizes that a quantity is small or insufficient. Always paired with a negative verb.",
        fun_facts: ["Unlike 'dake' (only), 'shika' implies 'nothing ELSE but this small amount'."],
        related: [
            { slug: "number-も", type: "Antonym", comparison: "shika implies 'too little'; mo implies 'surprisingly many'." }
        ]
    },
    {
        slug: "number-も",
        level: 11,
        title: "Number + も",
        meanings: ["As many as", "Emphasis"],
        structure: { patterns: ["Number + も"] },
        details: { part_of_speech: "Particle", word_type: "Adverbial Particle", register: "Standard" },
        about: "Used after a number to express that the quantity is larger or more surprising than expected.",
        fun_facts: ["'3 jikan mo' (As many as 3 hours) sounds much longer than just '3 jikan'."],
        related: []
    },
    {
        slug: "number-amount-は",
        level: 11,
        title: "Number/Amount + は",
        meanings: ["At least", "Or so"],
        structure: { patterns: ["Number + は"] },
        details: { part_of_speech: "Particle", word_type: "Adverbial Particle", register: "Standard" },
        about: "Using 'wa' after a quantity implies a contrastive 'at least' or gives an estimate.",
        fun_facts: ["Often followed by 'kurai' to mean 'at least about (amount)'."],
        related: []
    },
    {
        slug: "question-phrase-か",
        level: 11,
        title: "Question-phrase + か",
        meanings: ["Embedded question"],
        structure: { patterns: ["Question Word + か + Verb"] },
        details: { part_of_speech: "Expression", word_type: "Expression", register: "Standard" },
        about: "Used to include a question within a larger sentence (e.g., 'I don't know WHERE he is').",
        fun_facts: ["Functions like a nominalizer for the whole question clause."],
        related: []
    },
    {
        slug: "verbて-request",
        level: 11,
        title: "Verb[て]",
        meanings: ["Please (Casual Request)"],
        structure: { patterns: ["Verb［て］"] },
        details: { part_of_speech: "Expression", word_type: "Expression", register: "Casual" },
        about: "A casual way to ask someone to do something. Short for 'te kudasai'.",
        fun_facts: ["Ending with a rising intonation makes it a request. Soften it further by adding 'ne'."],
        related: [
            { slug: "てください", type: "Polite", comparison: "te is casual; te kudasai is polite." }
        ]
    }
];

async function main() {
    for (const item of n5_batch_7) {
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
    console.log('Batch 7 complete!');
}

main();
