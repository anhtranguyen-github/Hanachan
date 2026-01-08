
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Bypass Self-Signed Cert Error (Nuclear Option)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// 1. Load ENV
const envPath = path.join(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        let val = match[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        env[match[1].trim()] = val;
    }
});

const DATABASE_URL = env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('Error: DATABASE_URL not found in .env');
    process.exit(1);
}

// 2. Setup Client (Direct Connection Strategy)
// We avoid the Pooler (port 6543) for migrations because of "Tenant not found" and Transaction mode limitation issues.
// We reconstruct the user/host for Direct Connection (port 5432).

const urlMatch = DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
let clientConfig = {};

if (urlMatch) {
    const [_, user, password, host, port, dbNameWithParams] = urlMatch;

    // Extract Ref ID
    // User is usually 'postgres.REF' for pooler
    let refId = '';
    const userParts = user.split('.');

    // Check if we are on pooler
    if (userParts.length > 1) {
        refId = userParts[1];
    } else {
        // Maybe host has it? 'db.REF.supabase.co'
        const hostParts = host.split('.');
        if (hostParts[0] === 'db') refId = hostParts[1];
    }

    if (refId) {
        console.log(`Detected Project Ref: ${refId}. Switching to Direct Connection (5432)...`);
        clientConfig = {
            user: 'postgres',
            password: decodeURIComponent(password),
            host: `db.${refId}.supabase.co`,
            port: 5432,
            database: 'postgres',
            ssl: { rejectUnauthorized: false }
        };
    } else {
        // Fallback: Just use the string (e.g. localhost or non-supabase)
        console.log(`Could not detect Supabase Ref. Using original connection string.`);
        clientConfig = {
            connectionString: DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        };
    }
} else {
    clientConfig = {
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    };
}

const client = new Client(clientConfig);

async function runSQLFile(filePath, label) {
    if (!fs.existsSync(filePath)) {
        console.error(`Skipping ${label}: File not found at ${filePath}`);
        return;
    }

    console.log(`\n--- Running ${label} ---`);
    const sql = fs.readFileSync(filePath, 'utf8');

    try {
        const start = Date.now();
        // Split by semicolon (naive) won't work well for functions or complex text. 
        // PG driver can usually handle multiple statements in one query call.

        await client.query(sql);

        const duration = ((Date.now() - start) / 1000).toFixed(2);
        console.log(`✅ ${label} completed in ${duration}s`);
    } catch (err) {
        console.error(`❌ ${label} Failed:`);
        console.error(err.message);
        // Sometimes schema fails on DROP TYPE if dependent objects exist, which is expected.
    }
}

async function verifyCounts() {
    console.log('\n--- Verifying Data ---');
    const tables = ['knowledge_units', 'sentences', 'flashcards', 'decks'];

    for (const t of tables) {
        try {
            const res = await client.query(`SELECT count(*) FROM public.${t}`);
            console.log(`✅ ${t}: ${res.rows[0].count} rows`);
        } catch (err) {
            console.log(`⚠️  Could not count ${t}: ${err.message}`);
        }
    }
}

async function main() {
    console.log(`Connecting to Postgres...`);
    await client.connect();

    // 1. Run Schema (SKIPPED - User confirmed schema is fixed/applied)
    // const schemaPath = path.join(__dirname, '../docs/schema.sql');
    // await runSQLFile(schemaPath, 'Schema Migration');

    console.log("ℹ️ Skipping Schema Migration (Assuming tables exist)...");

    // 2. Run Seed
    const seedPath = path.join(__dirname, '../docs/seed.sql');
    if (fs.existsSync(seedPath)) {
        // Check size. if > 10MB, standard query might timeout or buffer overflow.
        // But pg usually handles 50MB fine. Our seed is ~35K rows.
        await runSQLFile(seedPath, 'Data Seeding');
    }

    // 3. Verify
    await verifyCounts();

    await client.end();
}

main().catch(async (err) => {
    console.error('Fatal Error:', err);
    await client.end();
});
