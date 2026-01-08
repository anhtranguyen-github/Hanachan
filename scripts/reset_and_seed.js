
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Load ENV
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const DATABASE_URL = envContent.match(/DATABASE_URL=(.*)/)?.[1]?.trim().replace(/['"]/g, '');

// Direct Connection Logic
const urlMatch = DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
let clientConfig = {};

if (urlMatch) {
    const [_, user, password, host, port, dbNameWithParams] = urlMatch;
    // Extract Ref
    let refId = '';
    const userParts = user.split('.');
    if (userParts.length > 1) refId = userParts[1];

    if (refId) {
        console.log(`Targeting Direct DB: db.${refId}.supabase.co:5432`);
        clientConfig = {
            user: 'postgres',
            password: decodeURIComponent(password),
            host: `db.${refId}.supabase.co`,
            port: 5432,
            database: 'postgres',
            ssl: { rejectUnauthorized: false }
        };
    } else {
        throw new Error("Could not extract Ref ID for Direct Connection.");
    }
}

const client = new Client(clientConfig);

async function main() {
    console.log("🔥 RESETTING DATABASE...");
    await client.connect();

    // 1. NUKE
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await client.query('GRANT ALL ON SCHEMA public TO postgres;');
    await client.query('GRANT ALL ON SCHEMA public TO public;');
    console.log("✅ Database Wiped Clean.");

    // 2. SCHEMA
    console.log("🏗️  Applying Schema...");
    const schemaSql = fs.readFileSync(path.join(__dirname, '../docs/schema.sql'), 'utf8');
    await client.query(schemaSql);
    console.log("✅ Schema Applied.");

    // 3. SEED
    console.log("🌱 Seeding Data...");
    const seedSql = fs.readFileSync(path.join(__dirname, '../docs/seed.sql'), 'utf8');
    await client.query(seedSql);
    console.log("✅ Data Seeded.");

    // 4. VERIFY
    const res = await client.query('SELECT count(*) FROM knowledge_units');
    console.log(`🏁 Done! Total KUs: ${res.rows[0].count}`);

    await client.end();
}

main().catch(err => {
    console.error("❌ Failed:", err);
    client.end();
});
