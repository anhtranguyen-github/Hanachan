import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function main() {
  const filePath = 'wanikani_subjects.json';
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const subjectsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const validSubjects = subjectsData.filter((s: any) => s.data && !s.data.hidden_at);
  console.log(`Local JSON: ${validSubjects.length} valid subjects`);

  // 1. Check total count
  const { count, error: countError } = await supabase
    .from('knowledge_units')
    .select('*', { count: 'exact', head: true })
    .ilike('slug', 'wk-%');

  if (countError) {
    console.error('Error fetching count:', countError);
  } else {
    console.log(`Cloud Supabase: ${count} "wk-" knowledge units`);
    if (count === validSubjects.length) {
      console.log('✅ Counts match!');
    } else {
      console.log(`⚠️ Counts differ: ${validSubjects.length} local vs ${count} cloud`);
    }
  }

  // 2. Sample comparison
  console.log('\n--- Sampling 5 random items for deep comparison ---');
  const samples = [];
  for (let i = 0; i < 5; i++) {
    samples.push(validSubjects[Math.floor(Math.random() * validSubjects.length)]);
  }

  for (const s of samples) {
    const slug = `wk-${s.object}-${s.data.slug || s.id}`;
    const { data: ku, error: kuError } = await supabase
      .from('knowledge_units')
      .select('*, radical_details(*), kanji_details(*), vocabulary_details(*)')
      .eq('slug', slug)
      .single();

    if (kuError || !ku) {
      console.error(`❌ Item ${slug} not found in cloud!`, kuError);
      continue;
    }

    const localMeaning = s.data.meanings.find((m: any) => m.primary)?.meaning || s.data.meanings[0]?.meaning;
    const match = 
      ku.meaning === localMeaning && 
      ku.level === s.data.level &&
      (ku.character === s.data.characters || (ku.character === null && !s.data.characters));

    if (match) {
      console.log(`✅ ${slug}: Data matches perfectly.`);
      
      // Check details based on type
      if (s.object === 'radical' && ku.radical_details?.meaning_mnemonic === s.data.meaning_mnemonic) {
         console.log('   (and radical_details match)');
      } else if (s.object === 'kanji' && ku.kanji_details?.meaning_mnemonic === s.data.meaning_mnemonic) {
         console.log('   (and kanji_details match)');
      } else if (s.object === 'vocabulary' && ku.vocabulary_details?.meaning_mnemonic === s.data.meaning_mnemonic) {
         console.log('   (and vocabulary_details match)');
      }
    } else {
      console.log(`❌ ${slug}: Data mismatch!`);
      console.log(`   Local: Level ${s.data.level}, Char: ${s.data.characters}, Meaning: ${localMeaning}`);
      console.log(`   Cloud: Level ${ku.level}, Char: ${ku.character}, Meaning: ${ku.meaning}`);
    }
  }
}

main().catch(console.error);
