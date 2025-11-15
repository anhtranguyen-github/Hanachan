
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("❌ Missing DATABASE_URL");
    process.exit(1);
}

const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});

async function verify() {
    try {
        await client.connect();
        console.log("🔍 Running Data Verification...");

        const queries = [
            { name: "KU Counts", query: `SELECT type, COUNT(*) as count FROM knowledge_units GROUP BY type` },
            { name: "Sentence Counts", query: `SELECT source_type, COUNT(*) as count FROM sentences GROUP BY source_type` },
            { name: "Grammar with Cloze", query: `SELECT COUNT(*) as count FROM ku_to_sentence WHERE cloze_positions IS NOT NULL` },
            { name: "Vocab with Audio", query: `SELECT COUNT(*) as count FROM ku_vocabulary WHERE jsonb_array_length(audio_assets) > 0` }
        ];

        for (const q of queries) {
            const res = await client.query(q.query);
            console.log(`\n📊 ${q.name}:`);
            console.table(res.rows);
        }

    } catch (err) {
        console.error("❌ Verification failed:", err);
    } finally {
        await client.end();
    }
}

verify();
