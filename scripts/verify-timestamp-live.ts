
import { youtubeScraper } from '../src/features/youtube/scraper';
import { YOUTUBE_TEST_VIDEO } from '../src/features/youtube/constants';

async function checkTimestampLive() {
    const videoId = YOUTUBE_TEST_VIDEO.ID;
    const targetSecond = 361; // 6:01

    console.log(`📡 Đang cào Transcript trực tiếp từ YouTube cho video ${videoId} (6:01)...`);

    try {
        const transcript = await youtubeScraper.fetchTranscript(videoId, 'ja');

        // Tìm segment bao phủ giây thứ 361
        const segment = transcript.find(s =>
            targetSecond >= s.offset && targetSecond <= (s.offset + s.duration + 1)
        );

        if (segment) {
            console.log(`✅ Kết quả:`);
            console.log(`[6:01] -> ${segment.text}`);
        } else {
            console.log("❓ Không tìm thấy segment chính xác tại 6:01. Dưới đây là các câu xung quanh:");
            const nearby = transcript.filter(s =>
                s.offset >= targetSecond - 10 && s.offset <= targetSecond + 10
            );
            nearby.forEach(s => {
                const min = Math.floor(s.offset / 60);
                const sec = Math.floor(s.offset % 60).toString().padStart(2, '0');
                console.log(`[${min}:${sec}] -> ${s.text}`);
            });
        }
    } catch (error: any) {
        console.error('❌ Lỗi:', error.message);
    }
}

checkTimestampLive();
