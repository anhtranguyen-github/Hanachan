
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

async function patchMasu() {
    const slug = 'polite-verb-endings';

    const { data: ku } = await supabase.from('knowledge_units').select('id').eq('slug', slug).single();
    if (!ku) return console.error('KU not found');

    const contentBlob = {
        about_description: "ます is an auxiliary verb introduced to verbs to create the 'polite form'. It connects to the conjunctive form (stem) of the verb to change its register to polite.",
        fun_facts: [
            "ます originally came from 参(まい)らす 'to humbly do', which over time changed to まらす, then まっす, and then finally ます.",
            "The imperative form of ます is ませ, which is seen in various set expressions."
        ],
        details_expanded: {
            part_of_speech: "Auxiliary Verb",
            word_type: "Dependent Word",
            register: "Polite"
        }
    };

    const { error: gErr } = await supabase.from('ku_grammar').update({
        structure: { patterns: ["Verb［stem］ + ます"] },
        details: "Auxiliary Verb",
        content_blob: contentBlob
    }).eq('ku_id', ku.id);

    if (gErr) console.error('Error patching Masu:', gErr);
    else console.log('Masu enriched!');
}

patchMasu();
