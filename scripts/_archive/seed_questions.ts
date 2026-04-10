
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seedQuestions() {
    console.log('--- Starting Question Seeding ---');

    // 1. Fetch all KUs with their details (paginated)
    let allKus: any[] = [];
    let from = 0;
    const PAGE_SIZE = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data: kus, error } = await supabase
            .from('knowledge_units')
            .select(`
                id, character, meaning, type,
                kanji_details(onyomi, kunyomi),
                vocabulary_details(reading),
                grammar_details(example_sentences)
            `)
            .range(from, from + PAGE_SIZE - 1);

        if (error) {
            console.error('Error fetching KUs:', error);
            return;
        }

        allKus = [...allKus, ...kus];
        console.log(`Fetched ${allKus.length} KUs so far...`);

        if (kus.length < PAGE_SIZE) {
            hasMore = false;
        } else {
            from += PAGE_SIZE;
        }
    }

    const kus = allKus;

    console.log(`Found ${kus.length} KOs to process...`);

    const questions: any[] = [];

    for (const ku of kus) {
        // Radical: 1 question (meaning)
        if (ku.type === 'radical') {
            questions.push({
                ku_id: ku.id,
                facet: 'meaning',
                type: 'fill_in',
                prompt: `What is the meaning of ${ku.character}?`,
                correct_answers: [ku.meaning.toLowerCase()]
            });
        }

        // Kanji: 2 questions (meaning + reading)
        if (ku.type === 'kanji') {
            // Meaning
            questions.push({
                ku_id: ku.id,
                facet: 'meaning',
                type: 'fill_in',
                prompt: `What is the meaning of ${ku.character}?`,
                correct_answers: [ku.meaning.toLowerCase()]
            });

            // Reading
            const details = ku.kanji_details as any;
            const readings = [
                ...(details?.onyomi || []),
                ...(details?.kunyomi || [])
            ].filter(Boolean);

            if (readings.length > 0) {
                questions.push({
                    ku_id: ku.id,
                    facet: 'reading',
                    type: 'fill_in',
                    prompt: `What is the reading of ${ku.character}?`,
                    correct_answers: readings
                });
            }
        }

        // Vocabulary: 2 questions (meaning + reading)
        if (ku.type === 'vocabulary') {
            // Meaning
            questions.push({
                ku_id: ku.id,
                facet: 'meaning',
                type: 'fill_in',
                prompt: `What is the meaning of ${ku.character}?`,
                correct_answers: [ku.meaning.toLowerCase()]
            });

            // Reading
            const reading = (ku.vocabulary_details as any)?.reading;
            if (reading) {
                questions.push({
                    ku_id: ku.id,
                    facet: 'reading',
                    type: 'fill_in',
                    prompt: `How do you read ${ku.character}?`,
                    correct_answers: [reading]
                });
            }
        }

        // Grammar: 1 cloze question
        if (ku.type === 'grammar') {
            const details = ku.grammar_details as any;
            const examples = details?.example_sentences || [];
            if (examples.length > 0) {
                const ex = examples[0];
                if (ex && ex.ja) {
                    const clozeText = ex.ja.replace(ku.character, '___');
                    questions.push({
                        ku_id: ku.id,
                        facet: 'cloze',
                        type: 'cloze',
                        prompt: 'Fill in the blank:',
                        cloze_text_with_blanks: clozeText,
                        correct_answers: [ku.character],
                        hints: [ex.en]
                    });
                }
            }
        }
    }

    console.log(`Generated ${questions.length} questions. Inserting in batches...`);

    // Inset in batches of 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < questions.length; i += BATCH_SIZE) {
        const batch = questions.slice(i, i + BATCH_SIZE);
        const { error: insertError } = await supabase
            .from('questions')
            .insert(batch);

        if (insertError) {
            console.error(`Error inserting batch ${i / BATCH_SIZE}:`, insertError);
        } else {
            console.log(`Inserted batch ${i / BATCH_SIZE + 1}/${Math.ceil(questions.length / BATCH_SIZE)}`);
        }
    }

    console.log('--- Question Seeding Complete ---');
}

seedQuestions().catch(console.error);
