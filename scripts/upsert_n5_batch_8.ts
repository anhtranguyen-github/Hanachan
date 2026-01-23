
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

const n5_batch_8 = [
    {
        slug: "じゃない-ではない",
        level: 11,
        title: "じゃない・ではない",
        meanings: ["Is not", "Are not"],
        structure: { patterns: ["Noun + じゃない/ではない"] },
        details: { part_of_speech: "Auxiliary Verb", word_type: "Negative Copula", register: "Standard/Casual" },
        about: "The negative version of the copula 'da' or 'desu'. 'Janai' is casual; 'dewanai' is more formal/written.",
        fun_facts: ["'Janai' is actually a contraction of 'de wa nai'."],
        related: []
    },
    {
        slug: "という",
        level: 11,
        title: "という",
        meanings: ["To be called", "Named"],
        structure: { patterns: ["(Name) + という + (Noun)"] },
        details: { part_of_speech: "Expression", word_type: "Verb", register: "Standard" },
        about: "Used to name or define something. Literally 'said as (A)'.",
        fun_facts: ["Very common when introducing people or things that the listener might not know."],
        related: []
    },
    {
        slug: "どうやって",
        level: 11,
        title: "どうやって",
        meanings: ["How", "In what way"],
        structure: { patterns: ["どうやって + Phrase"] },
        details: { part_of_speech: "Adverb", word_type: "Independent Word", register: "Standard" },
        about: "Interrogative used to ask about the method or process of doing something.",
        fun_facts: ["Literally 'doing what (how) and...'. More specific than just 'dou'."],
        related: []
    },
    {
        slug: "のは-that",
        level: 11,
        title: "のは",
        meanings: ["Nominalizer"],
        structure: { patterns: ["Verb (plain) + のは"] },
        details: { part_of_speech: "Particle", word_type: "Case Marking Particle", register: "Standard" },
        about: "Turns a verb phrase into a topic. Functions like 'As for the act of (doing)...'.",
        fun_facts: ["Essential for making sentences where the subject is an action."],
        related: []
    },
    {
        slug: "のだ-んだ",
        level: 11,
        title: "のだ・んだ",
        meanings: ["Explanatory", "The fact is"],
        structure: { patterns: ["Verb/Adj + のだ/んだ"] },
        details: { part_of_speech: "Expression", word_type: "Auxiliary Verb", register: "Standard" },
        about: "Casual version of 'nodesu/ndesu'. Used for emphasis or explanation.",
        fun_facts: ["'nda' is the more common spoken version. Sounds quite strong or masculine in some contexts."],
        related: []
    },
    {
        slug: "のも",
        level: 11,
        title: "のも",
        meanings: ["Also (Nominalizer)"],
        structure: { patterns: ["Verb (plain) + のも"] },
        details: { part_of_speech: "Particle", word_type: "Case Marking Particle", register: "Standard" },
        about: "Turns a verb phrase into a noun and adds 'also/too'.",
        fun_facts: ["'Taberu no mo suki' = 'I also like eating (in addition to something else)'."],
        related: []
    },
    {
        slug: "verbか-か-どうか",
        level: 11,
        title: "か・か～どうか",
        meanings: ["Whether or not"],
        structure: { patterns: ["Verb + か + どうか"] },
        details: { part_of_speech: "Expression", word_type: "Expression", register: "Standard" },
        about: "Used to create an embedded question about whether something is true or not.",
        fun_facts: ["'Dou ka' literally means 'how?'. So it's '(A) or how (is it)?'."],
        related: []
    },
    {
        slug: "verbな",
        level: 11,
        title: "な (Sentence Ending)",
        meanings: ["Don't", "Shouldn't"],
        structure: { patterns: ["Verb (dictionary form) + な"] },
        details: { part_of_speech: "Particle", word_type: "Sentence Ending Particle", register: "Standard" },
        about: "A strong prohibitive command. Very blunt.",
        fun_facts: ["Mostly used by men or people in authority in urgent situations."],
        related: []
    },
    {
        slug: "verbなさい",
        level: 11,
        title: "～なさい",
        meanings: ["Do (something)!"],
        structure: { patterns: ["Verb (stem) + なさい"] },
        details: { part_of_speech: "Expression", word_type: "Auxiliary Verb", register: "Standard" },
        about: "A polite but firm command. Often used by parents to children or teachers to students.",
        fun_facts: ["Derived from 'nasaru' (honorific 'to do'). Softened version of a strict command."],
        related: []
    },
    {
        slug: "adjective-の-は",
        level: 11,
        title: "Adjective + の(は)",
        meanings: ["The (Adj) one"],
        structure: { patterns: ["Adj + のは"] },
        details: { part_of_speech: "Expression", word_type: "Expression", register: "Standard" },
        about: "Used to refer to an object by its quality (e.g., 'The red one').",
        fun_facts: ["'Akai no wa' = 'The red one is...'."],
        related: []
    },
    {
        slug: "でも-助詞",
        level: 12,
        title: "でも",
        meanings: ["Even", "Or something"],
        structure: { patterns: ["Noun + でも"] },
        details: { part_of_speech: "Particle", word_type: "Adverbial Particle", register: "Standard" },
        about: "Used to suggest something as an example or to say 'even (A)'.",
        fun_facts: ["'O-cha demo nomimasu ka?' = 'Shall we have tea or something?' (soft suggestion)."],
        related: []
    },
    {
        slug: "ようと思う-おうと思う",
        level: 12,
        title: "～ようと思う",
        meanings: ["I think I will", "Thinking of doing"],
        structure: { patterns: ["Verb (volitional) + と思う"] },
        details: { part_of_speech: "Expression", word_type: "Expression", register: "Standard" },
        about: "Shows the speaker's current intention or plan.",
        fun_facts: ["The 'to omou' part indicates it's a thought in the speaker's mind."],
        related: []
    },
    {
        slug: "あとで",
        level: 12,
        title: "あとで",
        meanings: ["After", "Later"],
        structure: { patterns: ["Verb［た］+ あとで", "Noun + の + あとで"] },
        details: { part_of_speech: "Expression", word_type: "Case Marking Particle", register: "Standard" },
        about: "Used to describe something that happens later in time.",
        fun_facts: ["Always use past tense for verbs before 'あとで', because the action must be finished first."],
        related: []
    }
];

async function main() {
    for (const item of n5_batch_8) {
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
    }
    console.log('Batch 8 complete!');
}

main();
