
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function detailedCheck() {
    console.log('🔍 --- Detailed Database Content Check ---');

    // 1. user_learning_states count
    const { count: ulsCount, error: ulsError } = await supabase
        .from('user_learning_states')
        .select('*', { count: 'exact', head: true });

    if (ulsError) console.error('Error counting user_learning_states:', ulsError.message);
    else console.log(`📊 user_learning_states: ${ulsCount} records`);

    // 2. Levels for each KU type
    console.log('\n📊 Levels per KU Type:');
    const { data: levelTypeData, error: levelTypeError } = await supabase
        .from('knowledge_units')
        .select('type, level');

    if (levelTypeError) {
        console.error('Error fetching levels:', levelTypeError.message);
    } else {
        const typeLevelMap: Record<string, Set<number>> = {};
        levelTypeData.forEach(row => {
            if (!typeLevelMap[row.type]) typeLevelMap[row.type] = new Set();
            if (row.level !== null) typeLevelMap[row.type].add(row.level);
        });

        Object.entries(typeLevelMap).forEach(([type, levels]) => {
            const sortedLevels = Array.from(levels).sort((a, b) => a - b);
            console.log(` - ${type.padEnd(12)}: ${levels.size} distinct levels [${sortedLevels[0]}...${sortedLevels[sortedLevels.length - 1]}]`);
        });
    }

    // 3. KU distribution across levels (JLPT N5-N1 mapping check)
    console.log('\n📊 Knowledge Units per Level:');
    const levelsGrouped: Record<number, number> = {};
    levelTypeData?.forEach(row => {
        if (row.level !== null) {
            levelsGrouped[row.level] = (levelsGrouped[row.level] || 0) + 1;
        }
    });

    const sortedLevels = Object.keys(levelsGrouped).map(Number).sort((a, b) => a - b);
    sortedLevels.forEach(lvl => {
        console.log(` - Level ${lvl.toString().padEnd(2)}: ${levelsGrouped[lvl]} KUs`);
    });

    // 4. Check for JLPT metadata specifically if level is large
    // Level usually 1-60 if WK style. Let's see if there's a 1-5 level.
    const isJlptLevel = sortedLevels.length <= 10 && sortedLevels.includes(5);
    if (isJlptLevel) {
        console.log('\n✅ It appears "level" directly mapping to JLPT categories (1-5 or similar).');
    } else {
        console.log('\nℹ️ "level" appears to be granular levels (e.g. 1-60).');
    }

    console.log('\n------------------------------------------');
}

detailedCheck();
