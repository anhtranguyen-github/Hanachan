
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const DATA_DIR = path.resolve(__dirname, '../processed_data');
const BATCH_SIZE = 200;

async function seedFile(fileName, type) {
    console.log(`\n🚀 Seeding ${type} from ${fileName}...`);
    const filePath = path.join(DATA_DIR, fileName);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`📦 Total records to process: ${data.length}`);

    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);

        // 1. Prepare knowledge_units entries
        const kuEntries = batch.map(item => ({
            id: item.id, // Use existing id if it's a UUID
            external_id: item.id,
            type: type,
            slug: item.slug,
            level: item.level,
            search_key: item.search_key || item.character || '',
            character: item.character || null,
            meaning: item.meaning || item.meaning_summary || null
        }));

        const { error: kuError } = await supabase.from('knowledge_units').upsert(kuEntries, { onConflict: 'slug' });
        if (kuError) {
            console.error(`❌ Error seeding knowledge_units batch at ${i}:`, kuError.message);
            continue;
        }

        // 2. Prepare specific table entries
        let specificEntries = [];
        let tableName = '';

        if (type === 'radical') {
            tableName = 'ku_radicals';
            specificEntries = batch.map(item => ({
                ku_id: item.slug,
                character: item.character || null,
                name: item.name || '',
                meaning_story: item.meaning_story || {},
                image_json: item.image || {},
                metadata: { text_only: item.text_only }
            }));
        } else if (type === 'kanji') {
            tableName = 'ku_kanji';
            specificEntries = batch.map(item => ({
                ku_id: item.slug,
                character: item.character,
                meaning_data: { meanings: item.meanings || [item.meaning] },
                reading_data: {
                    onyomi: item.onyomi || [],
                    kunyomi: item.kunyomi || [],
                    nanori: item.nanori || []
                },
                metadata: { strokes: item.strokes }
            }));
        } else if (type === 'vocabulary') {
            tableName = 'ku_vocabulary';
            specificEntries = batch.map(item => ({
                ku_id: item.slug,
                character: item.character,
                reading_primary: item.reading_primary || '',
                meaning_data: item.meaning_data || {},
                audio_assets: item.audio || [],
                metadata: {}
            }));
        } else if (type === 'grammar') {
            tableName = 'ku_grammar';
            specificEntries = batch.map(item => ({
                ku_id: item.slug,
                title: item.search_key || '',
                meaning_summary: item.meaning_summary || '',
                meaning_story: item.meaning_story || {},
                structure_json: item.structure || {},
                metadata: {
                    level: item.level,
                    examples: item.examples || []
                }
            }));
        }

        if (tableName && specificEntries.length > 0) {
            const { error: spError } = await supabase.from(tableName).upsert(specificEntries, { onConflict: 'ku_id' });
            if (spError) {
                console.error(`❌ Error seeding ${tableName} batch at ${i}:`, spError.message);
            }
        }

        process.stdout.write(`\r✅ Processed ${Math.min(i + BATCH_SIZE, data.length)} / ${data.length}...`);
    }
    console.log(`\n🎉 Finished seeding ${type}.`);
}

async function runSeed() {
    console.log('🏁 Starting Master Seed Process...');

    await seedFile('processed_radicals.json', 'radical');
    await seedFile('processed_kanji.json', 'kanji');
    await seedFile('processed_vocab.json', 'vocabulary');
    await seedFile('processed_grammar.json', 'grammar');

    console.log('\n✅ --- SEEDING COMPLETE ---');
}

runSeed().catch(console.error);
