
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase URL or Service Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const PROCESSED_DIR = path.join(__dirname, '../processed_data');

async function seedType(fileName: string, type: string) {
    const filePath = path.join(PROCESSED_DIR, fileName);
    if (!fs.existsSync(filePath)) return;

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`🚀 Seeding ${type} via HTTP (${data.length} items)...`);

    // Tạo System User & Deck trước
    const dummyUserId = '00000000-0000-0000-0000-000000000000';
    await supabase.from('users').upsert({ id: dummyUserId, email: 'system@hanachan.local' });

    const deckName = `System ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    const { data: deckData } = await supabase.from('decks').upsert({ name: deckName, type: 'system' }).select().single();
    const deckId = deckData?.id;

    for (let i = 0; i < data.length; i += 50) {
        const chunk = data.slice(i, i + 50);

        // 1. Insert Knowledge Units
        const kus = chunk.map((item: any) => ({
            external_id: item.id,
            type: type,
            slug: item.slug,
            level: item.level,
            search_key: item.search_key
        }));

        const { data: insertedKus, error: kuErr } = await supabase.from('knowledge_units').upsert(kus, { onConflict: 'slug' }).select();
        if (kuErr) { console.error(`❌ KU Error:`, kuErr.message); continue; }

        // Map ID mới
        const slugToId = Object.fromEntries(insertedKus.map(k => [k.slug, k.id]));

        // 2. Insert Details & Interactions
        const details = [];
        const interactions = [];
        const sentencesToInsert = [];
        const kuToSentences = [];

        for (const item of chunk) {
            const kuId = slugToId[item.slug];
            if (!kuId) continue;

            interactions.push({ user_id: dummyUserId, deck_id: deckId, ku_id: kuId, state: 'New' });

            if (type === 'radical') {
                details.push({ ku_id: kuId, character: item.character, name: item.name, image_json: item.image, meaning_story: item.meaning_story });
            } else if (type === 'kanji') {
                details.push({ ku_id: kuId, character: item.character, meaning_data: item.meaning_data, reading_data: item.reading_data });
            } else if (type === 'vocabulary') {
                details.push({ ku_id: kuId, character: item.character, reading_primary: item.reading_primary, meaning_data: item.meaning_data, audio_assets: item.audio });
            } else if (type === 'grammar') {
                details.push({ ku_id: kuId, title: item.search_key, meaning_summary: item.meaning_summary, meaning_story: item.meaning_story, structure_json: item.structure });
            }
        }

        const tableMap: any = { radical: 'ku_radicals', kanji: 'ku_kanji', vocabulary: 'ku_vocabulary', grammar: 'ku_grammar' };
        await supabase.from(tableMap[type]).upsert(details, { onConflict: 'ku_id' });
        await supabase.from('deck_item_interactions').upsert(interactions, { onConflict: 'user_id,deck_id,ku_id' });

        // 3. Handle Sentences (Vocab & Grammar)
        if (type === 'vocabulary' || type === 'grammar') {
            for (const item of chunk) {
                const kuId = slugToId[item.slug];
                const examples = item.sentences || item.examples || [];
                if (!examples.length) continue;

                for (const ex of examples) {
                    const sentenceData = {
                        text_ja: ex.ja || ex.text_ja,
                        text_en: ex.en || ex.text_en,
                        text_tokens: ex.tokens,
                        audio_url: ex.audio,
                        source_type: type === 'vocabulary' ? 'wanikani' : 'bunpro'
                    };

                    const { data: sRes, error: sErr } = await supabase.from('sentences').upsert(sentenceData, { onConflict: 'text_ja' }).select().single();
                    if (sErr) continue;

                    await supabase.from('ku_to_sentence').upsert({
                        ku_id: kuId,
                        sentence_id: sRes.id,
                        is_primary: true,
                        cloze_positions: ex.cloze_positions || null
                    }, { onConflict: 'ku_id,sentence_id' });
                }
            }
        }

        process.stdout.write(`.`);
    }
    console.log(`\n✅ Finished ${type}`);
}

async function main() {
    // await seedType('processed_radicals.json', 'radical');
    // await seedType('processed_kanji.json', 'kanji');
    await seedType('processed_vocab.json', 'vocabulary');
    await seedType('processed_grammar.json', 'grammar');
}

main();
