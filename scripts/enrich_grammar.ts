
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Supabase Setup
const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';
const supabase = createClient(supabaseUrl, supabaseKey);

// Interfaces for our enriched data
interface EnrichedGrammar {
    slug: string;
    about: string;
    structure: {
        standard?: string;
        polite?: string;
        patterns: string[];
    };
    details: {
        part_of_speech?: string;
        register?: string;
        word_type?: string;
    };
    fun_facts: string[];
    related: {
        slug: string;
        type: string;
        comparison: string;
    }[];
}

async function enrichGrammarPoint(slug: string, rawData: any) {
    console.log(`Enriching: ${slug}...`);

    // 1. Initial Insert to Knowledge Units
    const { data: ku, error: kuErr } = await supabase.from('knowledge_units').upsert({
        slug: slug,
        type: 'grammar',
        level: rawData.level,
        meaning: rawData.meanings[0],
        search_key: rawData.title.toLowerCase()
    }, { onConflict: 'slug' }).select('id').single();

    if (kuErr) {
        console.error(`Error upserting KU ${slug}:`, kuErr);
        return;
    }

    // 2. Initial Insert to KU Grammar
    const { error: gErr } = await supabase.from('ku_grammar').upsert({
        ku_id: ku.id,
        structure: rawData.structure,
        details: rawData.details?.part_of_speech || 'Grammar'
    }, { onConflict: 'ku_id' });

    if (gErr) console.error(`Error inserting ku_grammar for ${slug}:`, gErr);

    // Note: We use the system's read_url_content capability via a temporary file 
    // that the AI agent (me) will read and then I'll manually process the next batch.
}

async function main() {
    const filePath = path.join(process.cwd(), 'data/grammar.json');
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const grammarPoints = content.data;

    // Process N5 points (level 10)
    const n5Points = grammarPoints.filter((g: any) => g.level === 10);
    console.log(`Found ${n5Points.length} N5 points.`);

    // For the first pass, we just ensure they are in the DB
    for (const g of n5Points.slice(0, 10)) {
        await enrichGrammarPoint(g.slug, g);
    }
}

main();
