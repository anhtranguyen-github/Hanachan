
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTimestamp() {
    const youtubeId = "ApCnmHLHARM";
    const targetSecond = 361; // 6:01

    console.log(`🔍 Đang truy vấn nội dung tại thời điểm 6:01 (361s) cho video ${youtubeId}...`);

    // 1. Lấy internal ID của video
    const { data: video } = await supabase
        .from('user_youtube_videos')
        .select('id')
        .eq('video_id', youtubeId)
        .limit(1)
        .single();

    if (!video) {
        console.error("❌ Video chưa được import vào Database.");
        return;
    }

    // 2. Lấy segment tại 6:01
    const { data: segments, error } = await supabase
        .from('user_youtube_video_segments')
        .select('text_ja, start_time, end_time')
        .eq('video_id', video.id)
        .gte('end_time', targetSecond)
        .lte('start_time', targetSecond + 5) // Tìm quanh khoảng đó
        .order('start_time', { ascending: true });

    if (error) {
        console.error("❌ Lỗi DB:", error.message);
    } else if (segments && segments.length > 0) {
        console.log(`✅ Kết quả tìm thấy:`);
        segments.forEach(s => {
            console.log(`[${Math.floor(s.start_time / 60)}:${Math.floor(s.start_time % 60)}] -> ${s.text_ja}`);
        });
    } else {
        console.log("❓ Không tìm thấy transcript tại giây thứ 361. Đang kiểm tra 10 giây xung quanh...");
        const { data: nearby } = await supabase
            .from('user_youtube_video_segments')
            .select('text_ja, start_time')
            .eq('video_id', video.id)
            .gte('start_time', targetSecond - 10)
            .lte('start_time', targetSecond + 10)
            .order('start_time', { ascending: true });

        nearby?.forEach(s => {
            console.log(`[${Math.floor(s.start_time / 60)}:${Math.floor(s.start_time % 60)}] -> ${s.text_ja}`);
        });
    }
}

checkTimestamp();
