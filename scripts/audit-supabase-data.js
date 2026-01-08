
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// 1. TLS Bypass (Required for Supabase Self-Signed Certs)
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
    console.error("❌ DATABASE_URL not found!");
    process.exit(1);
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
    console.log("🔍 Starting Supabase Data Audit...\n");

    const report = {};

    // --- 1. General Totals ---
    const totals = await client.query(`
        SELECT 
            (SELECT count(*) FROM knowledge_units) as total_ku,
            (SELECT count(*) FROM ku_vocabulary) as total_vocab,
            (SELECT count(*) FROM ku_kanji) as total_kanji,
            (SELECT count(*) FROM ku_radicals) as total_radicals,
            (SELECT count(*) FROM ku_grammar) as total_grammar,
            (SELECT count(*) FROM sentences) as total_sentences
    `);
    report.totals = totals.rows[0];

    // --- 2. Missing Fields in Core Tables ---
    const missingCore = await client.query(`
        SELECT
            SUM(CASE WHEN meaning IS NULL OR meaning = '' THEN 1 ELSE 0 END) as missing_meaning,
            SUM(CASE WHEN character IS NULL OR character = '' THEN 1 ELSE 0 END) as missing_character,
            SUM(CASE WHEN slug IS NULL OR slug = '' THEN 1 ELSE 0 END) as missing_slug
        FROM knowledge_units
    `);
    report.missing_core = missingCore.rows[0];

    // --- 3. Missing Fields in Detail Tables ---
    // Vocab
    const missingVocab = await client.query(`
        SELECT
            SUM(CASE WHEN reading_primary IS NULL OR reading_primary = '' OR reading_primary = 'unknown' THEN 1 ELSE 0 END) as missing_reading,
            SUM(CASE WHEN parts_of_speech IS NULL OR cardinality(parts_of_speech) = 0 THEN 1 ELSE 0 END) as missing_pos,
            SUM(CASE WHEN meaning_data IS NULL OR meaning_data = '{}'::jsonb THEN 1 ELSE 0 END) as empty_meaning_data
        FROM ku_vocabulary
    `);
    report.missing_vocab = missingVocab.rows[0];

    // Kanji
    const missingKanji = await client.query(`
        SELECT
            SUM(CASE WHEN video IS NULL OR video = '' THEN 1 ELSE 0 END) as missing_video,
            SUM(CASE WHEN meaning_data IS NULL OR meaning_data = '{}'::jsonb THEN 1 ELSE 0 END) as empty_meaning_data,
            SUM(CASE WHEN reading_data IS NULL OR reading_data = '{}'::jsonb THEN 1 ELSE 0 END) as empty_reading_data
        FROM ku_kanji
    `);
    report.missing_kanji = missingKanji.rows[0];

    // --- 4. Relational Integrity ---
    // Kanji without Radicals
    const kanjiNoRadicals = await client.query(`
        SELECT count(*) 
        FROM ku_kanji kk
        LEFT JOIN kanji_radicals kr ON kk.ku_id = kr.kanji_id
        WHERE kr.kanji_id IS NULL
    `);
    report.kanji_with_no_radicals = kanjiNoRadicals.rows[0].count;

    // Vocab without Sentence Links
    const vocabNoSentences = await client.query(`
        SELECT count(*)
        FROM ku_vocabulary kv
        LEFT JOIN ku_to_sentence kts ON kv.ku_id = kts.ku_id
        WHERE kts.ku_id IS NULL
    `);
    report.vocab_with_no_sentences = vocabNoSentences.rows[0].count;

    // --- 5. Empty Metadata ---
    const emptyJson = await client.query(`
        SELECT 
            SUM(CASE WHEN mnemonics IS NULL OR mnemonics = '{}'::jsonb THEN 1 ELSE 0 END) as empty_mnemonics
        FROM knowledge_units
    `);
    report.empty_metadata = emptyJson.rows[0];

    console.log("📊 AUDIT RESULTS:");
    console.log(JSON.stringify(report, null, 2));

    await client.end();
}

runAudit().catch(console.error);
