
import { YoutubeTranscript } from 'youtube-transcript';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import kuromoji from 'kuromoji';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl!, supabaseKey!);

const VIDEO_IDS = [
    '-cbuS40rNSw', // Bite Size Japanese #422
    'Po2KG7tJNJ8'  // Bite Size Japanese #324
];

async function run() {
    for (const id of VIDEO_IDS) {
        console.log(`Testing ${id}...`);
        try {
            const transcript = await YoutubeTranscript.fetchTranscript(id);
            console.log(`Success: ${transcript.length} segments`);
        } catch (e) {
            console.log(`Error for ${id}:`, e.message);

            console.log(`Retrying ${id} with lang: 'ja'...`);
            try {
                const transcript = await YoutubeTranscript.fetchTranscript(id, { lang: 'ja' });
                console.log(`Success (ja): ${transcript.length} segments`);
            } catch (e2) {
                console.log(`Error for ${id} (ja):`, e2.message);
            }
        }
    }
}

run();
