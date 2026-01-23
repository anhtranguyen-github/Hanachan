/**
 * Seed Official Level Decks (1-60)
 * 
 * This script creates system decks for each WaniKani level and populates
 * them with all knowledge units from that level.
 * 
 * Run with: npx tsx scripts/seed_official_decks.ts
 */

import { createClient } from '@supabase/supabase-js';

// Use environment variables or defaults for local Supabase
const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54421';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseKey);

const MAX_LEVEL = 60;
const BATCH_SIZE = 500;

interface DeckStats {
    level: number;
    deckId: string;
    radicals: number;
    kanji: number;
    vocabulary: number;
    grammar: number;
    total: number;
}

async function main() {
    console.log('='.repeat(60));
    console.log('🎓 SEEDING OFFICIAL LEVEL DECKS (1-60)');
    console.log('='.repeat(60));
    console.log(`Supabase URL: ${supabaseUrl}`);
    console.log('');

    // Step 1: Clean up existing system decks
    console.log('Step 1: Cleaning up existing system decks...');
    const { error: deleteError } = await supabase
        .from('decks')
        .delete()
        .eq('deck_type', 'system');

    if (deleteError) {
        console.error('Error deleting existing decks:', deleteError);
        // Continue anyway - table might not exist yet
    }
    console.log('✓ Existing system decks cleared\n');

    // Step 2: Create all 60 level decks
    console.log('Step 2: Creating 60 level decks...');
    const decksToInsert = [];
    for (let level = 1; level <= MAX_LEVEL; level++) {
        decksToInsert.push({
            name: `Level ${level}`,
            description: `WaniKani Level ${level} - All radicals, kanji, and vocabulary`,
            deck_type: 'system',
            level: level,
            owner_id: null
        });
    }

    const { data: createdDecks, error: createError } = await supabase
        .from('decks')
        .insert(decksToInsert)
        .select('id, level');

    if (createError) {
        console.error('Error creating decks:', createError);
        process.exit(1);
    }

    // Build level -> deck_id map
    const levelToDeckId = new Map<number, string>();
    createdDecks?.forEach(d => levelToDeckId.set(d.level, d.id));
    console.log(`✓ Created ${createdDecks?.length || 0} decks\n`);

    // Step 3: Fetch ALL knowledge units with levels (paginated to bypass 1000 limit)
    console.log('Step 3: Fetching all knowledge units (paginated)...');

    let allKUs: { id: string; level: number; type: string }[] = [];
    let offset = 0;
    const PAGE_SIZE = 1000;

    while (true) {
        const { data: batch, error: kuError } = await supabase
            .from('knowledge_units')
            .select('id, level, type')
            .not('level', 'is', null)
            .order('level', { ascending: true })
            .order('id', { ascending: true })  // Secondary sort for stable pagination
            .range(offset, offset + PAGE_SIZE - 1);

        if (kuError) {
            console.error('Error fetching KUs:', kuError);
            process.exit(1);
        }

        if (!batch || batch.length === 0) break;

        allKUs = allKUs.concat(batch);
        console.log(`  Fetched: ${allKUs.length} KUs so far...`);

        if (batch.length < PAGE_SIZE) break; // Last page
        offset += PAGE_SIZE;
    }

    console.log(`✓ Found ${allKUs.length} knowledge units with levels\n`);

    // Step 4: Create deck_items for each KU
    console.log('Step 4: Creating deck items...');
    const stats: DeckStats[] = [];
    const allDeckItems: { deck_id: string; ku_id: string; position: number }[] = [];

    // Group KUs by level
    const kusByLevel = new Map<number, typeof allKUs>();
    allKUs?.forEach(ku => {
        if (!ku.level) return;
        if (!kusByLevel.has(ku.level)) {
            kusByLevel.set(ku.level, []);
        }
        kusByLevel.get(ku.level)!.push(ku);
    });

    // Process each level
    for (let level = 1; level <= MAX_LEVEL; level++) {
        const deckId = levelToDeckId.get(level);
        if (!deckId) continue;

        const levelKUs = kusByLevel.get(level) || [];

        // Count by type
        const levelStats: DeckStats = {
            level,
            deckId,
            radicals: 0,
            kanji: 0,
            vocabulary: 0,
            grammar: 0,
            total: levelKUs.length
        };

        let position = 0;
        for (const ku of levelKUs) {
            // Count types
            if (ku.type === 'radical') levelStats.radicals++;
            else if (ku.type === 'kanji') levelStats.kanji++;
            else if (ku.type === 'vocabulary') levelStats.vocabulary++;
            else if (ku.type === 'grammar') levelStats.grammar++;

            allDeckItems.push({
                deck_id: deckId,
                ku_id: ku.id,
                position: position++
            });
        }

        stats.push(levelStats);
    }

    // Batch insert deck items
    console.log(`Inserting ${allDeckItems.length} deck items in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < allDeckItems.length; i += BATCH_SIZE) {
        const batch = allDeckItems.slice(i, i + BATCH_SIZE);
        const { error: insertError } = await supabase
            .from('deck_items')
            .insert(batch);

        if (insertError) {
            console.error(`Error inserting batch at ${i}:`, insertError);
            // Continue with other batches
        }

        if ((i + BATCH_SIZE) % 2000 === 0 || i + BATCH_SIZE >= allDeckItems.length) {
            console.log(`  Progress: ${Math.min(i + BATCH_SIZE, allDeckItems.length)}/${allDeckItems.length}`);
        }
    }

    console.log(`✓ Inserted ${allDeckItems.length} deck items\n`);

    // Step 5: Print summary
    console.log('='.repeat(60));
    console.log('📊 SUMMARY BY LEVEL');
    console.log('='.repeat(60));
    console.log('Level | Rad | Kan | Voc | Grm | Total');
    console.log('-'.repeat(40));

    let totalItems = 0;
    let levelsWithContent = 0;

    for (const s of stats) {
        if (s.total > 0) {
            console.log(
                `  ${s.level.toString().padStart(2)} | ${s.radicals.toString().padStart(3)} | ${s.kanji.toString().padStart(3)} | ${s.vocabulary.toString().padStart(3)} | ${s.grammar.toString().padStart(3)} | ${s.total}`
            );
            totalItems += s.total;
            levelsWithContent++;
        }
    }

    console.log('-'.repeat(40));
    console.log(`Total: ${totalItems} items across ${levelsWithContent} levels`);
    console.log('');
    console.log('✅ OFFICIAL DECKS SEEDING COMPLETE!');
}

main().catch(console.error);
