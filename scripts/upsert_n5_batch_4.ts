
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

const n5_batch_4 = [
    {
        slug: "その",
        level: 6,
        title: "その",
        meanings: ["That"],
        structure: { patterns: ["その + Noun"] },
        details: { part_of_speech: "Fixed Adjective", word_type: "Independent Word", register: "Standard" },
        about: "A pre-noun demonstrative adjective used for things near the listener. Part of the 'ko-so-a-do' system.",
        fun_facts: ["Always used before a noun and identifies something close to the listener (physically or emotionally)."],
        related: []
    },
    {
        slug: "それ",
        level: 6,
        title: "それ",
        meanings: ["That (thing)"],
        structure: { patterns: ["それ"] },
        details: { part_of_speech: "Noun", word_type: "Pronoun", register: "Standard" },
        about: "A pronoun referring to a thing near the listener. Can also point back to something mentioned previously.",
        fun_facts: ["While 'kore' is near the speaker, 'sore' is near the listener."],
        related: []
    },
    {
        slug: "たい",
        level: 6,
        title: "～たい",
        meanings: ["Want to do"],
        structure: { patterns: ["Verb (stem) + たい"] },
        details: { part_of_speech: "Auxiliary Verb", word_type: "Dependent Word", register: "Standard" },
        about: "Used to express the speaker's personal desire to do something. Conjugates like an い-Adjective.",
        fun_facts: ["The object of desire can be marked with either を or が. が emphasizes the object more."],
        related: []
    },
    {
        slug: "たくさん",
        level: 6,
        title: "たくさん",
        meanings: ["Many", "A lot", "Plenty"],
        structure: { patterns: ["たくさん + Phrase", "たくさん + の + Noun"] },
        details: { part_of_speech: "Noun", word_type: "Ordinary", register: "Standard" },
        about: "An adverb or noun used to describe a large amount or frequency of something.",
        fun_facts: ["When used with の, it emphasizes the noun. Without の, it modifies the whole activity/phrase."],
        related: []
    },
    {
        slug: "たことがある",
        level: 7,
        title: "～たことがある",
        meanings: ["Have done before"],
        structure: { patterns: ["Verb［た］+ こと + が + ある"] },
        details: { part_of_speech: "Expression", word_type: "Verb", register: "Standard" },
        about: "Used to express past experience. Literally 'The thing of having done (A) exists'.",
        fun_facts: ["Use 'ない' instead of 'ある' to say you have 'never' done something."],
        related: []
    },
    {
        slug: "たほうがいい",
        level: 7,
        title: "～たほうがいい",
        meanings: ["It'd be better to", "Should do"],
        structure: { patterns: ["Verb［た］+ ほうがいい"] },
        details: { part_of_speech: "Expression", word_type: "Adjective", register: "Standard" },
        about: "Used for giving advice or suggestions. Literally 'The way of having done (A) is good'.",
        fun_facts: ["It's quite direct and can imply negative consequences if the advice isn't followed. Use 'ばいい' for softer advice."],
        related: []
    },
    {
        slug: "たり-たりする",
        level: 7,
        title: "～たり～たりする",
        meanings: ["Things like ~ and ~"],
        structure: { patterns: ["Verb［た］り + Verb［た］り + する"] },
        details: { part_of_speech: "Particle", word_type: "Conjunctive Particle", register: "Standard" },
        about: "Used for listing actions or events that occur in no specific order. Always ends with a form of する.",
        fun_facts: ["Often used with just one verb to mean 'doing things like (A)'. Helps avoid the sequential nuance of 'て' form."],
        related: []
    },
    {
        slug: "だ",
        level: 7,
        title: "だ",
        meanings: ["To be", "Is"],
        structure: { patterns: ["Noun + だ", "［な］Adj + だ"] },
        details: { part_of_speech: "Auxiliary Verb", word_type: "Dependent Word", register: "Standard" },
        about: "The casual copula. Expresses determination or assertion. Used exclusively in plain/casual speech.",
        fun_facts: ["Cannot be used directly after い-Adjectives. The polite equivalent is 'です'."],
        related: [
            { slug: "です", type: "Polite", comparison: "です is the polite version; だ is the casual/plain version." }
        ]
    },
    {
        slug: "だけ",
        level: 7,
        title: "だけ",
        meanings: ["Only", "Just"],
        structure: { patterns: ["Any word + だけ"] },
        details: { part_of_speech: "Particle", word_type: "Adverbial Particle", register: "Standard" },
        about: "Indicates that the preceding word is the only true possibility among options.",
        fun_facts: ["When used with な-Adjectives, you need the 'な' (e.g., 静かなだけ)."],
        related: []
    },
    {
        slug: "だった-でした",
        level: 7,
        title: "だった・でした",
        meanings: ["Was", "Were"],
        structure: { patterns: ["Noun + だった/でした", "［な］Adj + だった/でした"] },
        details: { part_of_speech: "Auxiliary Verb", word_type: "Dependent Word", register: "Standard" },
        about: "The past tense of the copula 'だ' (casual) and 'です' (polite).",
        fun_facts: ["い-Adjectives have their own past tense conjugation and don't use だった/でした."],
        related: []
    },
    {
        slug: "だろう",
        level: 7,
        title: "だろう",
        meanings: ["Right?", "Probably"],
        structure: { patterns: ["Any word + だろう"] },
        details: { part_of_speech: "Auxiliary Verb", word_type: "Dependent Word", register: "Standard" },
        about: "Casual conjecture form of 'だ'. Expresses what the speaker thinks is probably true.",
        fun_facts: ["Often sounds masculine. The polite version is 'でしょう'."],
        related: [
            { slug: "でしょう", type: "Polite", comparison: "でしょう is polite; だろう is casual/plain." }
        ]
    },
    {
        slug: "って",
        level: 7,
        title: "って",
        meanings: ["Casual quotation"],
        structure: { patterns: ["Phrase + って"] },
        details: { part_of_speech: "Particle", word_type: "Case Marking Particle", register: "Casual" },
        about: "A casual version of the 'と' quotation particle. Used for referring to things said or thought.",
        fun_facts: ["Extremely common in casual speech. Can also be used to introduce a topic casually instead of 'は'."],
        related: [
            { slug: "と", type: "Formal", comparison: "と is standard; って is casual/spoken." }
        ]
    },
    {
        slug: "つもりだ",
        level: 7,
        title: "つもりだ",
        meanings: ["Plan to", "Intend to"],
        structure: { patterns: ["Verb (dictionary form) + つもりだ/です"] },
        details: { part_of_speech: "Expression", word_type: "Noun", register: "Standard" },
        about: "Expresses a person's intention or plan to perform an action.",
        fun_facts: ["Use 'ない' before つもり to say you 'intend NOT to' do something."],
        related: []
    },
    {
        slug: "ている1",
        level: 7,
        title: "～ている (Ongoing)",
        meanings: ["Is ~ing", "Am ~ing", "Are ~ing"],
        structure: { patterns: ["Verb［て］+ いる"] },
        details: { part_of_speech: "Conjunctive Particle", word_type: "Verb", register: "Standard" },
        about: "Expresses an ongoing action. Equivalent to the English '-ing' for action verbs.",
        fun_facts: ["In casual speech, the 'い' is often dropped (e.g., 食べてる)."],
        related: []
    },
    {
        slug: "ている2",
        level: 7,
        title: "～ている (State)",
        meanings: ["State of being", "Has done and remains"],
        structure: { patterns: ["Verb［て］+ いる"] },
        details: { part_of_speech: "Conjunctive Particle", word_type: "Verb", register: "Standard" },
        about: "Expresses a continuous state resulting from a past action (e.g., dead, married, knowing).",
        fun_facts: ["Verbs that change state instantly (like 'die' or 'marry') use this form for the ongoing state."],
        related: []
    },
    {
        slug: "ている3",
        level: 7,
        title: "～ている (Habit)",
        meanings: ["Repetitive action", "Habit"],
        structure: { patterns: ["Verb［て］+ いる"] },
        details: { part_of_speech: "Conjunctive Particle", word_type: "Verb", register: "Standard" },
        about: "Expresses habitual actions or repeated activities over time.",
        fun_facts: ["Often used with frequency words like 'every day' or 'always'."],
        related: []
    },
    {
        slug: "てから",
        level: 7,
        title: "～てから",
        meanings: ["After doing", "Once ... happens"],
        structure: { patterns: ["Verb［て］+ から"] },
        details: { part_of_speech: "Expression", word_type: "Case Marking Particle", register: "Standard" },
        about: "Expresses that one action happens strictly after another or as a result of it.",
        fun_facts: ["Emphasizes the completion of the first action as a prerequisite for the second."],
        related: []
    },
    {
        slug: "てください",
        level: 7,
        title: "～てください",
        meanings: ["Please do"],
        structure: { patterns: ["Verb［て］+ ください"] },
        details: { part_of_speech: "Expression", word_type: "Conjunctive Particle", register: "Polite" },
        about: "A standard polite way to make a request.",
        fun_facts: ["Omit 'kudasai' in very casual speech to just use the 'te' form as a request."],
        related: []
    },
    {
        slug: "てはいけない",
        level: 7,
        title: "～てはいけない",
        meanings: ["Must not", "May not"],
        structure: { patterns: ["Verb［て］+ は + いけない/だめだ"] },
        details: { part_of_speech: "Verb", word_type: "Auxiliary Verb", register: "Standard" },
        about: "Expresses prohibition or that something is not allowed.",
        fun_facts: ["'te wa' is often contracted to 'cha' in casual speech (e.g., 食べちゃいけない)."],
        related: []
    },
    {
        slug: "てもいい",
        level: 7,
        title: "～てもいい",
        meanings: ["Can/may", "Is alright even if"],
        structure: { patterns: ["Verb［て］+ もいい", "Adj/Noun + て/でもいい"] },
        details: { part_of_speech: "Expression", word_type: "Adjective", register: "Standard" },
        about: "Used for giving or asking for permission. Literally 'Even if (A), it is good'.",
        fun_facts: ["The 'mo' can be omitted for a more direct/casual feel."],
        related: []
    }
];

async function main() {
    for (const item of n5_batch_4) {
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
    console.log('Batch 4 complete!');
}

main();
