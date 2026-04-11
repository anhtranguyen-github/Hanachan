
const { createClient } = require('@supabase/supabase-js');
const kuromoji = require('kuromoji');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fcrrepkexghzchohbsrj.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY missing from .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TEST_EMAIL = 'test@hanachan.app';
const TEST_PASSWORD = 'password123';

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

async function run() {
    console.log(`--- 👤 Seeding Cloud User at ${supabaseUrl} ---`);

    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    const existingUser = users?.users?.find(u => u.email === TEST_EMAIL);

    if (existingUser) {
        console.log('User exists, updating password...');
        await supabase.auth.admin.updateUserById(existingUser.id, { password: TEST_PASSWORD });
    } else {
        console.log('Creating test user...');
        await supabase.auth.admin.createUser({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            email_confirm: true,
            user_metadata: { display_name: 'Test Cloud Learner' }
        });
    }

    console.log('--- 🎥 Seeding Video Data ---');
    const tokenizer = await getTokenizer();
    for (const v of MOCK_VIDEOS) {
        console.log(`Processing ${v.youtube_id}...`);
        const { data: video, error: vError } = await supabase
            .from('videos')
            .upsert({
                youtube_id: v.youtube_id,
                title: v.title,
                thumbnail_url: `https://img.youtube.com/vi/${v.youtube_id}/maxresdefault.jpg`,
                language: 'ja'
            }, { onConflict: 'youtube_id' })
            .select()
            .single();

        if (vError) {
            console.error('Video error:', vError);
            continue;
        }

        await supabase.from('video_subtitles').delete().eq('video_id', video.id);
        const subtitleEntries = v.subtitles.map(s => ({
            video_id: video.id,
            start_time_ms: s.start,
            end_time_ms: s.start + s.dur,
            text: s.text,
            tokens: tokenizer.tokenize(s.text).map(t => ({
                surface: t.surface_form,
                reading: t.reading,
                pos: t.pos
            }))
        }));

        await supabase.from('video_subtitles').insert(subtitleEntries);
    }
    console.log('Seeding complete.');
}

run();
