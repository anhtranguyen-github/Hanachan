
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

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

const RAW_URL = env.DATABASE_URL;

// Extract Password from RAW_URL (it's between : and @)
const match = RAW_URL.match(/:([^:@]+)@/);
const passwordEncoded = match ? match[1] : '';
const passwordDecoded = decodeURIComponent(passwordEncoded);

console.log('--- DEBUG CONNECTION ---');

async function tryConnect(config, label) {
    console.log(`\nTrying [${label}]...`);
    console.log(`User: ${config.user}`);
    console.log(`Host: ${config.host}:${config.port}`);
    console.log(`SSL: ${JSON.stringify(config.ssl)}`);

    const client = new Client(config);
    try {
        await client.connect();
        const res = await client.query('SELECT version()');
        console.log(`✅ SUCCESS! Version: ${res.rows[0].version}`);
        await client.end();
        return true;
    } catch (err) {
        console.log(`❌ FAILED: ${err.message}`);
        if (err.code) console.log(`   Code: ${err.code}`);
        await client.end();
        return false;
    }
}

async function main() {
    // 1. Original Pooler Config (Manual Parse)
    // postgres.xrmzrvjheddpekhzkxnx
    const poolerConfig = {
        user: 'postgres.xrmzrvjheddpekhzkxnx',
        password: passwordDecoded,
        host: 'aws-0-ap-southeast-1.pooler.supabase.com',
        port: 6543,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    };
    await tryConnect(poolerConfig, 'Pooler (Manual Config)');

    // 2. Direct Connection Config
    // User is just 'postgres' usually on direct? Or 'postgres'
    const directConfig = {
        user: 'postgres',
        password: passwordDecoded,
        host: 'db.xrmzrvjheddpekhzkxnx.supabase.co',
        port: 5432,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    };
    await tryConnect(directConfig, 'Direct DB (Standard)');
}

main();
