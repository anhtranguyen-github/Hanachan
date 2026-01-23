
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

const n5_batch_5 = [
    {
        slug: "で-by",
        level: 8,
        title: "で (By/With)",
        meanings: ["With", "By (using)", "In"],
        structure: { patterns: ["Noun + で"] },
        details: { part_of_speech: "Particle", word_type: "Case Marking Particle", register: "Standard" },
        about: "Used to mark the tool, means, or instrument used to perform an action. Can also mark a group as a collective tool.",
        fun_facts: ["When used with a groups (like 'we' or 'family'), it emphasizes the group as a single unit performing the action together."],
        related: [
            { slug: "で", type: "Comparison", comparison: "This 'で' marks means; the other 'で' marks location." }
        ]
    },
    {
        slug: "で",
        level: 8,
        title: "で (At/In)",
        meanings: ["At", "In"],
        structure: { patterns: ["Place + で"] },
        details: { part_of_speech: "Particle", word_type: "Case Marking Particle", register: "Standard" },
        about: "Used to mark the location where an action or activity takes place.",
        fun_facts: ["Unlike 'に' (which marks a target or destination), 'で' marks the stage or arena where the action happens."],
        related: [
            { slug: "に", type: "Contrast", comparison: "で is for activities; に is for existence or destination." }
        ]
    },
    {
        slug: "でしょう",
        level: 8,
        title: "でしょう",
        meanings: ["Right?", "Probably", "Isn't it?"],
        structure: { patterns: ["Any word + でしょう"] },
        details: { part_of_speech: "Auxiliary Verb", word_type: "Dependent Word", register: "Polite" },
        about: "Polite conjecture form. Expresses assertion about something that the speaker assumes the listener agrees with.",
        fun_facts: ["Conjugated form of 'です'. Used in weather forecasts and when seeking confirmation politely."],
        related: [
            { slug: "だろう", type: "Casual", comparison: "でしょう is polite; だろう is the casual/masculine version." }
        ]
    },
    {
        slug: "です",
        level: 8,
        title: "です",
        meanings: ["To be", "Is"],
        structure: { patterns: ["Noun + です", "Adjective + です"] },
        details: { part_of_speech: "Auxiliary Verb", word_type: "Dependent Word", register: "Polite" },
        about: "The polite copula. Expresses determination or assertion. Standard way to end sentences politely.",
        fun_facts: ["Can be used with い-Adjectives in spoken language, though some formalists avoid it in strict writing."],
        related: [
            { slug: "だ", type: "Casual", comparison: "です is polite; だ is casual." }
        ]
    },
    {
        slug: "と-and",
        level: 8,
        title: "と (And)",
        meanings: ["And"],
        structure: { patterns: ["Noun + と + Noun"] },
        details: { part_of_speech: "Particle", word_type: "Case Marking Particle", register: "Standard" },
        about: "Used to link nouns together. Implies a complete list (A and B and nothing else).",
        fun_facts: ["The last 'と' in a list is usually omitted in conversation, though grammatically correct if included."],
        related: [
            { slug: "や", type: "Comparison", comparison: "と is for complete lists; や is for incomplete lists (things like...)." }
        ]
    },
    {
        slug: "と-with",
        level: 8,
        title: "と (With)",
        meanings: ["With"],
        structure: { patterns: ["Noun + と"] },
        details: { part_of_speech: "Particle", word_type: "Case Marking Particle", register: "Standard" },
        about: "Used to indicate the person or object with whom an action is performed mutually.",
        fun_facts: ["Implies mutual involvement. 'Friend to hashiru' (runs with a friend) means you both are running."],
        related: []
    },
    {
        slug: "と",
        level: 8,
        title: "と (Quotation)",
        meanings: ["Quotation marker"],
        structure: { patterns: ["Phrase/Clause + と + Verb"] },
        details: { part_of_speech: "Particle", word_type: "Case Marking Particle", register: "Standard" },
        about: "Used to mark the content of speech, thoughts, or feelings. Often followed by 'iu' (say) or 'omou' (think).",
        fun_facts: ["Functions like quotation marks in English. The final verb (like 'to iu') is sometimes omitted in casual speech."],
        related: [
            { slug: "って", type: "Casual", comparison: "と is the standard marker; って is the casual/spoken version." }
        ]
    },
    {
        slug: "どこ",
        level: 8,
        title: "どこ",
        meanings: ["Where"],
        structure: { patterns: ["どこ"] },
        details: { part_of_speech: "Noun", word_type: "Pronoun", register: "Standard" },
        about: "Interrogative pronoun used to ask about place or location.",
        fun_facts: ["Part of the 'dore' family. Can be used with particles (doko ni, doko de, etc.)."],
        related: []
    },
    {
        slug: "どの",
        level: 8,
        title: "どの",
        meanings: ["Which (of 3 or more)"],
        structure: { patterns: ["どの + Noun"] },
        details: { part_of_speech: "Fixed Adjective", word_type: "Independent Word", register: "Standard" },
        about: "Pre-noun interrogative used to ask which specific item among several possibilities.",
        fun_facts: ["Unlike 'dore', 'dono' must be followed by a noun."],
        related: [
            { slug: "どれ", type: "Comparison", comparison: "どの must be followed by a noun; どれ is a standalone pronoun." }
        ]
    },
    {
        slug: "どれ",
        level: 8,
        title: "どれ",
        meanings: ["Which (of 3 or more)"],
        structure: { patterns: ["どれ"] },
        details: { part_of_speech: "Noun", word_type: "Pronoun", register: "Standard" },
        about: "Standalone interrogative pronoun used to ask which item among three or more options.",
        fun_facts: ["When choosing between only two things, use 'dotchi' or 'dochira' instead."],
        related: []
    },
    {
        slug: "な",
        level: 8,
        title: "な (Prohibitive)",
        meanings: ["Do not", "Don't"],
        structure: { patterns: ["Verb (dictionary form) + な"] },
        details: { part_of_speech: "Particle", word_type: "Sentence Ending Particle", register: "Standard" },
        about: "A strong, blunt command not to do something. Used mostly by males or in very urgent/casual situations.",
        fun_facts: ["Very different from the 'na' in な-Adjectives. This one marks the end of a command."],
        related: [
            { slug: "ないでください", type: "Polite", comparison: "ないでください is polite; dictionary + な is very blunt." }
        ]
    },
    {
        slug: "な-adjective-noun",
        level: 8,
        title: "な-Adjective + Noun",
        meanings: ["Describing a noun"],
        structure: { patterns: ["［な］Adj + な + Noun"] },
        details: { part_of_speech: "Adjective", word_type: "Adjectival Noun", register: "Standard" },
        about: "The way to use な-Adjectives to describe the qualities of a noun.",
        fun_facts: ["The name 'な-Adjective' comes from this specific 'な' that appears only when describing a noun."],
        related: []
    },
    {
        slug: "な-adjective-predicate",
        level: 8,
        title: "な-Adjective (Predicate)",
        meanings: ["Is (quality)"],
        structure: { patterns: ["Noun + は + ［な］Adj + だ/です"] },
        details: { part_of_speech: "Adjective", word_type: "Adjectival Noun", register: "Standard" },
        about: "Using a な-Adjective at the end of a sentence to describe the topic.",
        fun_facts: ["When used as a predicate, the 'な' is dropped and replaced with 'だ' or 'です' (or nothing in casual speech)."],
        related: []
    },
    {
        slug: "な-adjectives",
        level: 8,
        title: "な-Adjectives",
        meanings: ["Adjectival Nouns"],
        structure: { patterns: ["Various"] },
        details: { part_of_speech: "Adjective", word_type: "Adjectival Noun", register: "Standard" },
        about: "A class of words that behave mostly like nouns but can act as adjectives. Mostly of foreign origin.",
        fun_facts: ["Use the 'totemo' (very) test: if 'totemo + word' sounds natural, it's likely a な-Adjective."],
        related: []
    },
    {
        slug: "ないでください",
        level: 8,
        title: "～ないでください",
        meanings: ["Please don't"],
        structure: { patterns: ["Verb［ない］+ でください"] },
        details: { part_of_speech: "Expression", word_type: "Auxiliary Verb", register: "Polite" },
        about: "A polite way to ask or command someone NOT to do something.",
        fun_facts: ["Formed by verb negative form + 'de' + 'kudasai'. Omit 'kudasai' for casual negative requests."],
        related: []
    },
    {
        slug: "ないほうがいい",
        level: 8,
        title: "～ないほうがいい",
        meanings: ["Shouldn't do", "It'd be better not to"],
        structure: { patterns: ["Verb［ない］+ ほうがいい"] },
        details: { part_of_speech: "Expression", word_type: "Adjective", register: "Standard" },
        about: "Used for giving negative advice or suggestions. Literally 'The way of NOT doing is better'.",
        fun_facts: ["Just as direct as 'たほうがいい'. Use for warning someone of negative consequences."],
        related: [
            { slug: "たほうがいい", type: "Antonym", comparison: "たほうがいい is 'should'; ないほうがいい is 'shouldn't'." }
        ]
    },
    {
        slug: "なくちゃ-なきゃ",
        level: 8,
        title: "～なくちゃ・～なきゃ",
        meanings: ["Must do", "Have to do"],
        structure: { patterns: ["Verb［ない］+ なくちゃ/なきゃ"] },
        details: { part_of_speech: "Expression", word_type: "Informal Speech", register: "Casual" },
        about: "Casual abbreviations of 'nakute wa (ikenai)' and 'nakereba (ikenai)'. Translates to 'gotta' or 'must'.",
        fun_facts: ["'nakya' is very common among younger speakers. 'nakucha' is also widely used by all."],
        related: []
    },
    {
        slug: "なくてはいけない",
        level: 9,
        title: "～なくてはいけない",
        meanings: ["Must do", "Have to do"],
        structure: { patterns: ["Verb［ない］+ なくてはいけない"] },
        details: { part_of_speech: "Expression", word_type: "Auxiliary Verb", register: "Polite/Formal" },
        about: "Double negative expression meaning 'must do'. Literally 'if you don't do, it won't go well'.",
        fun_facts: ["Common in both spoken and written Japanese. 'Ikenai' implies it's personally/socially unacceptable not to do it."],
        related: []
    },
    {
        slug: "なくてはならない",
        level: 9,
        title: "～なくてはならない",
        meanings: ["Must do", "Have to do"],
        structure: { patterns: ["Verb［ない］+ なくてはならない"] },
        details: { part_of_speech: "Expression", word_type: "Auxiliary Verb", register: "Formal" },
        about: "The most formal way to express obligation. Literally 'if you don't do, it cannot become'.",
        fun_facts: ["Commonly used in formal writing, speeches, or when discussing objective rules and laws."],
        related: []
    },
    {
        slug: "なにか-なにも",
        level: 9,
        title: "なにか・なにも",
        meanings: ["Something / Nothing"],
        structure: { patterns: ["なにか + Phrase", "なも + Negative Phrase"] },
        details: { part_of_speech: "Noun", word_type: "Adverbial Particle", register: "Standard" },
        about: "Used to express 'something/anything' (nanika) or 'nothing/not anything' (nanimo).",
        fun_facts: ["'Nanimo' is always paired with a negative verb. 'Nanika' is for affirmative or questions."],
        related: []
    }
];

async function main() {
    for (const item of n5_batch_5) {
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
    console.log('Batch 5 complete!');
}

main();
