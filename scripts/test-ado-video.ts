
import { youtubeScraper } from '../src/features/youtube/scraper';
import { YOUTUBE_TEST_VIDEO } from '../src/features/youtube/constants';

async function testNewVideo() {
    const videoId = YOUTUBE_TEST_VIDEO.ID;
    console.log(`📡 Đang cào Transcript cho video: ${YOUTUBE_TEST_VIDEO.TITLE}...`);

    try {
        const transcript = await youtubeScraper.fetchTranscript(videoId, 'ja');
        console.log(`✅ Thành công! Tìm thấy ${transcript.length} dòng phụ đề.`);

        console.log('\n--- 5 câu đầu tiên của bài hát ---');
        transcript.slice(0, 5).forEach(s => {
            console.log(`[${Math.floor(s.offset / 60)}:${Math.floor(s.offset % 60)}] -> ${s.text}`);
        });

        console.log('\n--- Kiểm tra mốc 1:00 ---');
        const target = transcript.find(s => s.offset >= 60 && s.offset <= 65);
        if (target) {
            console.log(`[1:00] -> ${target.text}`);
        }

    } catch (error: any) {
        console.error('❌ Lỗi:', error.message);
    }
}

testNewVideo();
