
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase URL or Service Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const PROCESSED_DIR = path.join(__dirname, '../processed_data');

async function seedSentences(fileName: string, type: string) {
    const filePath = path.join(PROCESSED_DIR, fileName);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`🚀 Seeding sentences for ${type} (${data.length} Knowledge Units)...`);

    for (let i = 0; i < data.length; i += 20) { // Small chunks for safer API calls
        const chunk = data.slice(i, i + 20);

        // Map slug to UUID first since we need IDs for linking
        const slugs = chunk.map((item: any) => item.slug);
        const { data: kuData, error: kuErr } = await supabase.from('knowledge_units').select('id, slug').in('slug', slugs);

        if (kuErr || !kuData) {
            console.error(`❌ Error fetching KU IDs:`, kuErr?.message);
            continue;
        }

        const slugToId = Object.fromEntries(kuData.map(k => [k.slug, k.id]));

        for (const item of chunk) {
            const kuId = slugToId[item.slug];
            if (!kuId) continue;

            const examples = item.sentences || item.examples || [];
            if (!examples.length) continue;

            for (const ex of examples) {
                const textJa = ex.ja || ex.text_ja;
                if (!textJa) continue;

                const sentenceData = {
                    text_ja: textJa,
                    text_en: ex.en || ex.text_en,
                    text_tokens: ex.tokens || null,
                    audio_url: ex.audio || null,
                    source_type: type === 'vocabulary' ? 'wanikani' : 'bunpro',
                    is_verified: true
                };

                // Upsert sentence
                const { data: sRes, error: sErr } = await supabase
                    .from('sentences')
                    .upsert(sentenceData, { onConflict: 'text_ja' })
                    .select()
                    .single();

                if (sErr) {
                    console.error(`❌ Sentence Error [${textJa.substring(0, 20)}...]:`, sErr.message);
                    continue;
                }

                // Link KU to Sentence
                // Note: DB schema might expect 'New' instead of 'new' based on logs
                await supabase.from('ku_to_sentence').upsert({
                    ku_id: kuId,
                    sentence_id: sRes.id,
                    is_primary: true,
                    cloze_positions: ex.cloze_positions || null
                }, { onConflict: 'ku_id,sentence_id' });
            }
        }
        process.stdout.write(`.`);
    }
    console.log(`\n✅ Finished sentences for ${type}`);
}

async function main() {
    console.log("🛠️ Starting Sentence Seeding...");
    await seedSentences('processed_vocab.json', 'vocabulary');
    await seedSentences('processed_grammar.json', 'grammar');
    console.log("🎯 All sentence data synced successfully!");
}

main().catch(err => console.error("💥 Global Seed Error:", err));
