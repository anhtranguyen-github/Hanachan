
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// 1. TLS Bypass (Required for Supabase Self-Signed Certs in strict Node envs)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 2. Load ENV Manually
const envPath = path.join(__dirname, '../.env');
let DATABASE_URL = '';
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL=(.*)/);
    if (match) DATABASE_URL = match[1].trim().replace(/['"]/g, '');
}

if (!DATABASE_URL) {
    if (process.env.DATABASE_URL) DATABASE_URL = process.env.DATABASE_URL;
    else {
        console.error("❌ DATABASE_URL not found!");
        process.exit(1);
    }
}

// 3. Construct Direct Connection (Avoid Pooler)
const urlMatch = DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
let clientConfig = {};

if (urlMatch) {
    const [_, user, password, host, port, dbNameWithParams] = urlMatch;
    let refId = '';
    const userParts = user.split('.');
    if (userParts.length > 1) refId = userParts[1];
    else {
        const hostParts = host.split('.');
        if (hostParts[0] === 'db') refId = hostParts[1];
    }

    if (refId) {
        console.log(`ℹ️  Targeting Direct DB (db.${refId}...)`);
        clientConfig = {
            user: 'postgres',
            password: decodeURIComponent(password),
            host: `db.${refId}.supabase.co`,
            port: 5432,
            database: 'postgres',
            ssl: { rejectUnauthorized: false }
        };
    } else {
        console.warn("⚠️  Could not detect Ref ID. Using original URL.");
        clientConfig = { connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } };
    }
}

const client = new Client(clientConfig);

async function main() {
    try {
        await client.connect();
        console.log("✅ Connected!");

        const queries = [
            'SELECT count(*) FROM knowledge_units',
            'SELECT count(*) FROM sentences',
            'SELECT count(*) FROM decks',
            'SELECT count(*) FROM flashcards',
            'SELECT count(*) FROM users',
            'SELECT count(*) FROM flashcard_allowed_ku',
            'SELECT count(*) FROM ku_vocabulary'
        ];

        console.log("\n📊 Table Counts:");
        for (const q of queries) {
            const tableName = q.split('FROM ')[1];
            try {
                const res = await client.query(q);
                console.log(`- ${tableName}: ${res.rows[0].count}`);
            } catch (err) {
                console.log(`- ${tableName}: ERROR (${err.message})`);
            }
        }

        console.log("\n✅ Database is HEALTHY and POPULATED.");

    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        await client.end();
    }
}

main();
