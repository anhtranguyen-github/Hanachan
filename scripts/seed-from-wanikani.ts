import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const BATCH_SIZE = 100;

async function upsertInBatches(table: string, items: any[], onConflict: string = 'slug', select: string = 'id, slug') {
  const allData: any[] = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase.from(table).upsert(batch, { onConflict }).select(select);
    if (error) {
       console.error(`Error in ${table} batch ${i/BATCH_SIZE}:`, error);
    } else if (data) {
      console.log(`Upserted ${data.length} into ${table}`);
      allData.push(...data);
    }
  }
  return allData;
}

async function main() {
  const filePath = 'wanikani_subjects.json';
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  // Verification step: Check if knowledge_units table exists
  const { error: verifyError } = await supabase.from('knowledge_units').select('id').limit(1);
  if (verifyError && verifyError.code === 'PGRST205') {
    console.error('ERROR: Table "knowledge_units" not found in your Supabase project.');
    console.error('Please ensure you have applied the schema migrations (db/cloud_supabase_schema.sql) to your cloud instance.');
    process.exit(1);
  }

  console.log('Reading WaniKani subjects...');
  const subjectsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log(`Total subjects in file: ${subjectsData.length}`);

  // 1. Prepare knowledge_units
  const validSubjects = subjectsData.filter((s: any) => s.data && !s.data.hidden_at);
  
  const kuList = validSubjects.map((s: any) => {
    const primaryMeaning = s.data.meanings.find((m: any) => m.primary)?.meaning || s.data.meanings[0]?.meaning;
    return {
      slug: `wk-${s.object}-${s.data.slug || s.id}`,
      type: s.object,
      character: s.data.characters || null,
      meaning: primaryMeaning,
      level: s.data.level,
      document_url: s.data.document_url,
      metadata: {
        wk_id: s.id,
        meanings: s.data.meanings,
        auxiliary_meanings: s.data.auxiliary_meanings,
        lesson_position: s.data.lesson_position,
        amalgamation_subject_ids: s.data.amalgamation_subject_ids || [],
        component_subject_ids: s.data.component_subject_ids || []
      }
    };
  });

  console.log(`Seeding ${kuList.length} knowledge_units...`);
  const insertedKU = await upsertInBatches('knowledge_units', kuList);

  // 2. Map slugs to UUIDs
  console.log('Mapping slugs/IDs to UUIDs...');
  const slugToId = new Map<string, string>(insertedKU.map((s: any) => [s.slug, s.id]));
  const wkIdToId = new Map<number, string>(validSubjects.map((s: any) => {
      const slug = `wk-${s.object}-${s.data.slug || s.id}`;
      return [s.id, slugToId.get(slug)!];
  }));

  // 3. Prepare details and learning states
  const radicalDetails: any[] = [];
  const kanjiDetails: any[] = [];
  const vocabularyDetails: any[] = [];
  const learningStates: any[] = [];

  // Assuming we use the first authenticated user for seeding progression if needed, 
  // or just skipping progression seeding if no USER_ID is provided.
  const SEED_USER_ID = process.env.SEED_USER_ID; 

  for (const s of validSubjects) {
    const kuSlug = `wk-${s.object}-${s.data.slug || s.id}`;
    const kuId = slugToId.get(kuSlug);
    if (!kuId) continue;

    // Progression State
    if (SEED_USER_ID && s.assignment) {
        learningStates.push({
            user_id: SEED_USER_ID,
            ku_id: kuId,
            facet: 'meaning', // Default facet
            wanikani_state: s.assignment.burned_at ? 'burned' : 
                          s.assignment.started_at ? 'review' : 
                          s.assignment.unlocked_at ? 'in_lessons' : 'locked',
            unlocked_at: s.assignment.unlocked_at,
            started_at: s.assignment.started_at,
            burned_at: s.assignment.burned_at,
            state: s.assignment.burned_at ? 'mastered' : (s.assignment.started_at ? 'learning' : 'new')
        });
    }

    if (s.object === 'radical') {
      radicalDetails.push({
        ku_id: kuId,
        meaning_mnemonic: s.data.meaning_mnemonic,
        meaning_hint: s.data.meaning_hint,
        image_url: s.data.character_images?.find((img: any) => img.content_type === 'image/svg+xml' && !img.metadata.inline_styles)?.url || s.data.character_images?.[0]?.url || null,
        character_images: s.data.character_images,
        metadata: { character_images: s.data.character_images }
      });
    } else if (s.object === 'kanji') {
      const onyomi = (s.data.readings || []).filter((r: any) => r.type === 'onyomi').map((r: any) => r.reading);
      const kunyomi = (s.data.readings || []).filter((r: any) => r.type === 'kunyomi').map((r: any) => r.reading);
      kanjiDetails.push({
        ku_id: kuId,
        onyomi,
        kunyomi,
        meaning_mnemonic: s.data.meaning_mnemonic,
        meaning_hint: s.data.meaning_hint,
        reading_mnemonic: s.data.reading_mnemonic,
        reading_hint: s.data.reading_hint,
        metadata: { readings: s.data.readings }
      });
    } else if (s.object === 'vocabulary') {
      vocabularyDetails.push({
        ku_id: kuId,
        reading: s.data.readings?.[0]?.reading || null,
        parts_of_speech: s.data.parts_of_speech || [],
        meaning_mnemonic: s.data.meaning_mnemonic,
        meaning_hint: s.data.meaning_hint,
        reading_hint: s.data.reading_hint,
        context_sentences: s.data.context_sentences || [],
        pronunciation_audios: s.data.pronunciation_audios || [],
        audio_url: s.data.pronunciation_audios?.[0]?.url || null,
        metadata: {
          readings: s.data.readings,
          pronunciation_audios: s.data.pronunciation_audios
        }
      });
    }
  }

  if (radicalDetails.length > 0) {
    console.log(`Seeding ${radicalDetails.length} radical_details...`);
    await upsertInBatches('radical_details', radicalDetails, 'ku_id', 'ku_id');
  }

  if (kanjiDetails.length > 0) {
    console.log(`Seeding ${kanjiDetails.length} kanji_details...`);
    await upsertInBatches('kanji_details', kanjiDetails, 'ku_id', 'ku_id');
  }

  if (vocabularyDetails.length > 0) {
    console.log(`Seeding ${vocabularyDetails.length} vocabulary_details...`);
    await upsertInBatches('vocabulary_details', vocabularyDetails, 'ku_id', 'ku_id');
  }

  if (learningStates.length > 0) {
      console.log(`Seeding ${learningStates.length} user_learning_states...`);
      await upsertInBatches('user_learning_states', learningStates, 'user_id, ku_id, facet', 'id');
  }

  console.log('Seeding finished successfully!');
}

main().catch(console.error);
