
import fs from 'fs';
import path from 'path';

const PROCESSED_DIR = path.join(__dirname, '../dbsu/processed_data');
const OUTPUT_FILE = path.join(__dirname, '../seed_cloud.sql');

function escapeSql(str: string) {
    if (typeof str !== 'string') return str;
    return str.replace(/'/g, "''");
}

async function generate() {
    let sql = "";
    const grammarData = JSON.parse(fs.readFileSync(path.join(PROCESSED_DIR, 'processed_grammar.json'), 'utf-8'));

    console.log("🛠️ Generating SQL for Grammar...");

    // Tạo User Dummy trước
    sql += `INSERT INTO users (id, email, display_name) VALUES ('00000000-0000-0000-0000-000000000000', 'system@hanachan.local', 'System User') ON CONFLICT DO NOTHING;\n`;

    // Tạo Deck System Grammar
    sql += `INSERT INTO decks (name, type) VALUES ('System Grammar', 'system') ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name;\n`;

    for (const item of grammarData.slice(0, 50)) { // Lấy 50 cái đầu để test trước
        const externalId = item.id;
        const slug = item.slug;
        const searchKey = item.search_key;

        // 1. KU
        sql += `INSERT INTO knowledge_units (external_id, type, slug, level, search_key) 
                VALUES ('${externalId}', 'grammar', '${slug}', ${item.level}, '${escapeSql(searchKey)}') 
                ON CONFLICT (slug) DO UPDATE SET search_key = EXCLUDED.search_key;\n`;

        // 2. Detail
        sql += `INSERT INTO ku_grammar (ku_id, title, meaning_summary, meaning_story, structure_json) 
                SELECT id, '${escapeSql(searchKey)}', '${escapeSql(item.meaning_summary || '')}', '${JSON.stringify(item.meaning_story)}', '${JSON.stringify(item.structure)}'
                FROM knowledge_units WHERE slug = '${slug}' ON CONFLICT (ku_id) DO NOTHING;\n`;

        // 3. Interactions
        sql += `INSERT INTO deck_item_interactions (user_id, deck_id, ku_id, state) 
                SELECT '00000000-0000-0000-0000-000000000000', d.id, k.id, 'New'
                FROM decks d, knowledge_units k 
                WHERE d.name = 'System Grammar' AND k.slug = '${slug}' ON CONFLICT DO NOTHING;\n`;
    }

    fs.writeFileSync(OUTPUT_FILE, sql);
    console.log(`✅ SQL file generated at: ${OUTPUT_FILE}`);
}

generate();
