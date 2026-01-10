
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const envPath = path.join(__dirname, '../.env');
let DATABASE_URL = '';
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/DATABASE_URL=(.*)/);
    if (match) DATABASE_URL = match[1].trim().replace(/['"]/g, '');
}

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
        clientConfig = {
            user: 'postgres',
            password: decodeURIComponent(password),
            host: `db.${refId}.supabase.co`,
            port: 5432,
            database: 'postgres',
            ssl: { rejectUnauthorized: false }
        };
    }
}

async function runAudit() {
    const client = new Client(clientConfig);
    await client.connect();
    console.log("🔍 Deep Relation Audit...\n");

    const report = {};

    // 1. Check Relations
    const relations = await client.query(`
        SELECT 
            'kanji_radicals' as table_name, (SELECT count(*) FROM kanji_radicals) as count
        UNION ALL
            SELECT 'vocab_kanji', (SELECT count(*) FROM vocab_kanji)
        UNION ALL
            SELECT 'grammar_relations', (SELECT count(*) FROM grammar_relations)
        UNION ALL
            SELECT 'grammar_sentences', (SELECT count(*) FROM grammar_sentences)
        UNION ALL
            SELECT 'grammar_vocabulary', (SELECT count(*) FROM grammar_vocabulary)
        UNION ALL
            SELECT 'ku_to_sentence', (SELECT count(*) FROM ku_to_sentence)
    `);
    report.relations = relations.rows;

    // 2. Sample data checking
    const sampleVocab = await client.query(`SELECT ku_id, meaning_data FROM ku_vocabulary LIMIT 1`);
    report.sample_vocab_detail = sampleVocab.rows[0];

    const sampleKanji = await client.query(`SELECT ku_id, meaning_data, reading_data FROM ku_kanji LIMIT 1`);
    report.sample_kanji_detail = sampleKanji.rows[0];

    console.log(JSON.stringify(report, null, 2));

    await client.end();
}

runAudit().catch(console.error);
