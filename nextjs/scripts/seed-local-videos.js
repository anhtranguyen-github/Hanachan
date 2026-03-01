
const { createClient } = require('@supabase/supabase-js');
const kuromoji = require('kuromoji');

const supabaseUrl = 'http://127.0.0.1:54421';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

const supabase = createClient(supabaseUrl, supabaseKey);

const MOCK_VIDEOS = [
    {
        youtube_id: '-cbuS40rNSw',
        title: '好きな仕事 #日本語ポッドキャスト',
        subtitles: [
            { start: 0, dur: 3000, text: 'こんにちは、みなさん。' },
            { start: 3000, dur: 4000, text: '今日は好きな仕事について話します。' },
            { start: 7000, dur: 3000, text: '日本語を勉強しましょう。' }
        ]
    },
    {
        youtube_id: 'Po2KG7tJNJ8',
        title: '人生・仕事について思うこと',
        subtitles: [
            { start: 0, dur: 3000, text: '人生は長いです。' },
            { start: 3000, dur: 4000, text: '仕事も大切ですね。' }
        ]
    }
];

async function getTokenizer() {
    return new Promise((resolve, reject) => {
        kuromoji.builder({ dicPath: 'node_modules/kuromoji/dict' }).build((err, tokenizer) => {
            if (err) reject(err);
            else resolve(tokenizer);
        });
    });
}

async function seed() {
    const tokenizer = await getTokenizer();

    for (const v of MOCK_VIDEOS) {
        console.log(`Seeding ${v.youtube_id}...`);

        const { data: video, error: vError } = await supabase
            .from('videos')
            .upsert({
                youtube_id: v.youtube_id,
                title: v.title,
                thumbnail_url: `https://img.youtube.com/vi/${v.youtube_id}/maxresdefault.jpg`,
                language: 'ja'
            })
            .select()
            .single();

        if (vError) {
            console.error('Video error:', vError);
            continue;
        }

        // Subtitles
        await supabase.from('video_subtitles').delete().eq('video_id', video.id);
        const subtitleEntries = v.subtitles.map(s => {
            const tokens = tokenizer.tokenize(s.text).map(t => ({
                surface: t.surface_form,
                reading: t.reading,
                pos: t.pos
            }));
            return {
                video_id: video.id,
                start_time_ms: s.start,
                end_time_ms: s.start + s.dur,
                text: s.text,
                tokens
            };
        });

        await supabase.from('video_subtitles').insert(subtitleEntries);
        console.log(`Done ${v.youtube_id}`);
    }
}

seed();
