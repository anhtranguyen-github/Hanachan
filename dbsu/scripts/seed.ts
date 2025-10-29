
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("❌ Missing DATABASE_URL");
    process.exit(1);
}

const pool = new Pool({
    connectionString: databaseUrl,
    family: 4,
    ssl: { rejectUnauthorized: false }
});
const PROCESSED_DIR = path.join(__dirname, '../processed_data');

async function seedData(fileName: string, type: string) {
    const filePath = path.join(PROCESSED_DIR, fileName);
    if (!fs.existsSync(filePath)) return;
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const client = await pool.connect();

    console.log(`📥 Seeding ${type}...`);
    try {
        await client.query('BEGIN');
        for (const item of data) {
            // 1. Registry
            const res = await client.query(
                `INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                 VALUES ($1, $2, $3, $4, $5) ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key RETURNING id`,
                [item.id, item.type, item.slug, item.level, item.search_key]
            );
            const kuId = res.rows[0].id;

            // 2. Specific Detail (Use UPSERT)
            if (type === 'radical') {
                await client.query(`INSERT INTO ku_radicals (ku_id, character, image_json, name, meaning_story) 
                     VALUES ($1, $2, $3, $4, $5) 
                     ON CONFLICT (ku_id) DO UPDATE SET character = EXCLUDED.character, name = EXCLUDED.name`,
                    [kuId, item.character, JSON.stringify(item.image), item.name, JSON.stringify(item.meaning_story)]);
            } else if (type === 'kanji') {
                await client.query(`INSERT INTO ku_kanji (ku_id, character, meaning_data, reading_data) 
                     VALUES ($1, $2, $3, $4) 
                     ON CONFLICT (ku_id) DO UPDATE SET character = EXCLUDED.character, meaning_data = EXCLUDED.meaning_data`,
                    [kuId, item.character, JSON.stringify(item.meaning_data), JSON.stringify(item.reading_data)]);
            } else if (type === 'vocabulary') {
                await client.query(`INSERT INTO ku_vocabulary (ku_id, character, reading_primary, meaning_data, audio_assets) 
                     VALUES ($1, $2, $3, $4, $5) 
                     ON CONFLICT (ku_id) DO UPDATE SET reading_primary = EXCLUDED.reading_primary`,
                    [kuId, item.character, item.reading_primary, JSON.stringify(item.meaning_data), JSON.stringify(item.audio)]);
                for (const sent of item.sentences) {
                    const sRes = await client.query(`INSERT INTO sentences (text_ja, text_en, text_tokens, source_type) 
                         VALUES ($1, $2, $3, 'wanikani') ON CONFLICT DO NOTHING RETURNING id`,
                        [sent.ja, sent.en, JSON.stringify(sent.tokens)]);
                    if (sRes.rows[0]) {
                        await client.query(`INSERT INTO ku_to_sentence (ku_id, sentence_id, is_primary) VALUES ($1, $2, true) ON CONFLICT DO NOTHING`, [kuId, sRes.rows[0].id]);
                    }
                }
            } else if (type === 'grammar') {
                await client.query(`INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                     VALUES ($1, $2, $3, $4, $5) 
                     ON CONFLICT (ku_id) DO UPDATE SET title = EXCLUDED.title, meaning_summary = EXCLUDED.meaning_summary`,
                    [kuId, item.search_key, item.meaning_summary, JSON.stringify(item.meaning_story), JSON.stringify(item.structure)]);
                for (const ex of item.examples) {
                    const sRes = await client.query(`INSERT INTO sentences (text_ja, text_en, text_tokens, audio_url, source_type) 
                         VALUES ($1, $2, $3, $4, 'bunpro') ON CONFLICT DO NOTHING RETURNING id`,
                        [ex.text_ja, ex.text_en, JSON.stringify(ex.tokens), ex.audio]);
                    if (sRes.rows[0]) {
                        await client.query(`INSERT INTO ku_to_sentence (ku_id, sentence_id, is_primary, cloze_positions) 
                             VALUES ($1, $2, true, $3) ON CONFLICT DO NOTHING`,
                            [kuId, sRes.rows[0].id, JSON.stringify(ex.cloze_positions)]);
                    }
                }
            }
            // 3. (NEW) RPG-Style: Initialize Local Context Progress
            const dummyUserId = '00000000-0000-0000-0000-000000000000';
            await client.query(`INSERT INTO users (id, email, display_name) VALUES ($1, 'system@hanachan.local', 'System User') ON CONFLICT DO NOTHING`, [dummyUserId]);

            // For simplicity in seeding, we assume a "Main Deck" for each type if not specified
            const deckName = `System ${type.charAt(0).toUpperCase() + type.slice(1)}`;
            const deckRes = await client.query(`INSERT INTO decks (name, type) VALUES ($1, 'system') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`, [deckName]);
            const deckId = deckRes.rows[0].id;

            // Link KU to Deck
            await client.query(`INSERT INTO deck_items (deck_id, ku_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [deckId, kuId]);

            // Initialize Interaction Progress
            await client.query(
                `INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                 VALUES ($1, $2, $3, 'New') ON CONFLICT DO NOTHING`,
                [dummyUserId, deckId, kuId]
            );
        }
        await client.query('COMMIT');
        console.log(`✅ ${type} finished (with Deck Progress initialized).`);
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(`❌ Error seeding ${type}:`, e);
    } finally {
        client.release();
    }
}

async function main() {
    await seedData('processed_radicals.json', 'radical');
    await seedData('processed_kanji.json', 'kanji');
    await seedData('processed_vocab.json', 'vocabulary');
    await seedData('processed_grammar.json', 'grammar');
    await pool.end();
}

main();
