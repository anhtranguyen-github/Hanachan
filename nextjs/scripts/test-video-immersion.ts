
import { YoutubeTranscript } from 'youtube-transcript';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import kuromoji from 'kuromoji';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const VIDEO_IDS = [
    '-cbuS40rNSw', // Bite Size Japanese #422
    'Po2KG7tJNJ8',  // Bite Size Japanese #324
    'MmvaYPjogwQ'   // OkkeiJapanese
];

async function getTokenizer(): Promise<kuromoji.Tokenizer<kuromoji.IpadicFeatures>> {
    return new Promise((resolve, reject) => {
        kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((err, tokenizer) => {
            if (err) reject(err);
            else resolve(tokenizer);
        });
    });
}

async function processVideo(youtubeId: string, tokenizer: kuromoji.Tokenizer<kuromoji.IpadicFeatures>) {
    console.log(`\n--- Processing Video: ${youtubeId} ---`);

    try {
        // 1. Fetch transcript
        console.log('Fetching transcript...');
        let transcript;
        try {
            transcript = await YoutubeTranscript.fetchTranscript(youtubeId);
        } catch (e) {
            console.warn(`Could not fetch transcript for ${youtubeId}: ${e.message}`);
            return false;
        }

        if (!transcript || transcript.length === 0) {
            console.warn(`No transcript found for ${youtubeId}`);
            return false;
        }

        console.log(`Fetched ${transcript.length} subtitle segments.`);

        // 2. Create/Update video entry
        const { data: video, error: vError } = await supabase
            .from('videos')
            .upsert({
                youtube_id: youtubeId,
                title: `YouTube Video ${youtubeId}`,
                thumbnail_url: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
                language: 'ja',
                updated_at: new Date().toISOString()
            }, { onConflict: 'youtube_id' })
            .select()
            .single();

        if (vError) throw vError;
        const videoId = video.id;

        // 3. Process subtitles and tokens
        console.log('Tokenizing subtitles...');
        const subtitleEntries = [];
        const wordFrequencies = new Map<string, any>();

        for (const segment of transcript) {
            const tokens = tokenizer.tokenize(segment.text);
            const processedTokens = tokens.map(t => ({
                surface: t.surface_form,
                reading: t.reading,
                pos: t.pos
            }));

            tokens.forEach(t => {
                if (['助詞', '助動詞', '記号', '補助記号'].includes(t.pos)) return;
                const entry = wordFrequencies.get(t.surface_form) || { count: 0, reading: t.reading };
                entry.count++;
                wordFrequencies.set(t.surface_form, entry);
            });

            subtitleEntries.push({
                video_id: videoId,
                start_time_ms: Math.round(segment.offset),
                end_time_ms: Math.round(segment.offset + segment.duration),
                text: segment.text,
                tokens: processedTokens
            });
        }

        // 4. Batch insert subtitles
        console.log('Saving subtitles to database...');
        await supabase.from('video_subtitles').delete().eq('video_id', videoId);

        for (let i = 0; i < subtitleEntries.length; i += 100) {
            const batch = subtitleEntries.slice(i, i + 100);
            const { error: sError } = await supabase.from('video_subtitles').insert(batch);
            if (sError) console.error(`Batch ${i} error:`, sError);
        }

        // 5. Save vocab stats
        console.log('Saving vocabulary stats...');
        const vocabStats = Array.from(wordFrequencies.entries()).map(([surface, data]) => ({
            video_id: videoId,
            surface,
            reading: data.reading,
            frequency: data.count
        }));

        await supabase.from('video_vocab_stats').delete().eq('video_id', videoId);
        for (let i = 0; i < vocabStats.length; i += 100) {
            const batch = vocabStats.slice(i, i + 100);
            await supabase.from('video_vocab_stats').insert(batch);
        }

        console.log(`Successfully processed ${youtubeId}`);
        return true;
    } catch (error) {
        console.error(`Failed to process ${youtubeId}:`, error);
        return false;
    }
}

async function run() {
    const tokenizer = await getTokenizer();
    for (const id of VIDEO_IDS) {
        await processVideo(id, tokenizer);
    }
    console.log('\nAll tests complete.');
}

run();
