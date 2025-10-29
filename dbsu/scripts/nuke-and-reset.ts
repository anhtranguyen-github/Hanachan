
import { Client } from 'pg';
import dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("❌ Missing DATABASE_URL");
    process.exit(1);
}

async function nuke() {
    const client = new Client({ connectionString: databaseUrl, family: 4, ssl: { rejectUnauthorized: false } });
    try {
        await client.connect();
        console.log("🧨 NUKING database...");

        // Danh sách các bảng cần xóa theo thứ tự ngược lại của khóa ngoại
        const tables = [
            'deck_item_interactions',
            'fsrs_history',
            'user_learning_states',
            'deck_items',
            'decks',
            'ku_to_sentence',
            'sentences',
            'user_youtube_videos',
            'user_daily_stats',
            'user_analysis_history',
            'user_settings',
            'users',
            'ku_graph',
            'ku_grammar',
            'ku_vocabulary',
            'ku_kanji',
            'ku_radicals',
            'knowledge_units'
        ];

        for (const table of tables) {
            await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        }

        // Xóa Types
        await client.query(`DROP TYPE IF EXISTS ku_type CASCADE`);
        await client.query(`DROP TYPE IF EXISTS fsrs_state CASCADE`);
        await client.query(`DROP TYPE IF EXISTS interaction_state CASCADE`);

        console.log("🏙️ Database is now CLEAN.");
    } catch (err) {
        console.error("❌ Nuke failed:", err);
    } finally {
        await client.end();
    }
}

async function main() {
    await nuke();

    console.log("🏗️ Re-building schema...");
    try {
        execSync('bun dbsu/scripts/migrate.ts', { stdio: 'inherit' });

        console.log("🌱 Re-seeding data...");
        execSync('bun dbsu/scripts/seed.ts', { stdio: 'inherit' });

        console.log("🚀 CLOUD IS READY!");
    } catch (e) {
        console.error("❌ Reset process failed at some step.");
    }
}

main();
