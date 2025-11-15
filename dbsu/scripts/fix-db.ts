
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log("🛠️ Adding UNIQUE constraint to sentences(text_ja)...");

        // Check if constraint exists already
        const checkQuery = `
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'sentences' AND constraint_type = 'UNIQUE';
        `;
        const checkRes = await client.query(checkQuery);
        console.log("Current constraints:", checkRes.rows);

        // Add UNIQUE constraint
        await client.query('ALTER TABLE sentences ADD CONSTRAINT sentences_text_ja_key UNIQUE (text_ja);');
        console.log("✅ UNIQUE constraint added successfully!");

    } catch (err: any) {
        if (err.message.includes('already exists')) {
            console.log("ℹ️ UNIQUE constraint already exists.");
        } else {
            console.error("❌ Failed to add constraint:", err.message);
        }
    } finally {
        await client.end();
    }
}

run();
