import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)
const BATCH_SIZE = 100

async function upsertInBatches(table: string, items: any[], onConflict: string = 'slug') {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    const { data, error } = await supabase.from(table).upsert(batch, { onConflict }).select()
    if (error) {
       console.error(`Error in ${table} batch ${i/BATCH_SIZE}:`, error)
       if (error.code === '42P01') {
         console.error(`ERROR: Table '${table}' does not exist. Please apply the 00001_core_schema.sql migration to your cloud instance.`)
         process.exit(1)
       }
    } else {
      console.log(`Upserted ${data?.length} into ${table}`)
    }
  }
}

async function seedRadicals() {
  console.log('Seeding Radicals...')
  const filePath = path.resolve(__dirname, '../../data/radicals.json')
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    return
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  
  const subjects = data.map((r: any) => ({
    slug: `radical-${r.name.toLowerCase().replace(/ /g, '-')}`,
    type: 'radical',
    characters: r.character,
    level: r.level,
    meaning_primary: r.name,
    meanings: JSON.stringify([r.name]),
    meaning_mnemonic: r.mnemonic,
  }))

  await upsertInBatches('subjects', subjects)
}

async function seedKanji() {
  console.log('Seeding Kanji...')
  const filePath = path.resolve(__dirname, '../../data/kanji.jsonl')
  if (!fs.existsSync(filePath)) return

  const fileStream = fs.createReadStream(filePath)
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })

  const kanjiList: any[] = []
  for await (const line of rl) {
    const k = JSON.parse(line)
    kanjiList.push({
      slug: k.slug || `kanji-${k.character}`,
      type: 'kanji',
      characters: k.character,
      level: k.level,
      meaning_primary: k.meanings.primary[0],
      meanings: JSON.stringify(k.meanings.primary.concat(k.meanings.secondary || [])),
      meaning_mnemonic: k.readings.mnemonic,
    })
  }

  await upsertInBatches('subjects', kanjiList)

  // Fetch IDs for details
  const { data: inserted } = await supabase.from('subjects').select('id, slug').eq('type', 'kanji')
  const slugToId = new Map(inserted?.map(s => [s.slug, s.id]))

  const rl2 = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity })
  const details = []
  for await (const line of rl2) {
    const k = JSON.parse(line)
    const id = slugToId.get(k.slug || `kanji-${k.character}`)
    if (id) {
      details.push({
        subject_id: id,
        onyomi: k.readings.onyomi,
        kunyomi: k.readings.kunyomi,
        meaning_hint: k.readings.mnemonic
      })
    }
  }
  await upsertInBatches('subject_details', details, 'subject_id')
}

async function seedVocab() {
  console.log('Seeding Vocabulary...')
  const filePath = path.resolve(__dirname, '../../data/vocab.jsonl')
  if (!fs.existsSync(filePath)) return

  const fileStream = fs.createReadStream(filePath)
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity })

  const vocabList: any[] = []
  for await (const line of rl) {
    const v = JSON.parse(line)
    vocabList.push({
      slug: v.slug || `vocab-${v.character}`,
      type: 'vocabulary',
      characters: v.character,
      level: v.level,
      meaning_primary: v.meanings.primary[0],
      meanings: JSON.stringify(v.meanings.primary.concat(v.meanings.secondary || [])),
    })
  }
  await upsertInBatches('subjects', vocabList)

  const { data: inserted } = await supabase.from('subjects').select('id, slug').eq('type', 'vocabulary')
  const slugToId = new Map(inserted?.map(s => [s.slug, s.id]))

  const rl2 = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity })
  const details = []
  for await (const line of rl2) {
    const v = JSON.parse(line)
    const id = slugToId.get(v.slug || `vocab-${v.character}`)
    if (id) {
      details.push({
        subject_id: id,
        reading_primary: v.readings.primary,
        parts_of_speech: v.meanings.word_types || [],
        context_sentences: JSON.stringify(v.context_sentences || []),
        pitch_accent: JSON.stringify(v.readings.pitch_accent || [])
      })
    }
  }
  await upsertInBatches('subject_details', details, 'subject_id')
}

async function main() {
  console.log('Starting seed process...')
  await seedRadicals()
  await seedKanji()
  await seedVocab()
  console.log('Seeding finished successfully!')
}

main().catch(console.error)
