
import { youtubeService } from '../src/features/youtube/service';
import { YOUTUBE_TEST_VIDEO } from '../src/features/youtube/constants';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testYouTubeImport() {
    const userId = "00000000-0000-0000-0000-000000000000"; // Dummy System User or your real ID
    console.log(`🎬 Đang chạy Import thử nghiệm cho Video: ${YOUTUBE_TEST_VIDEO.TITLE}`);
    console.log(`Link: ${YOUTUBE_TEST_VIDEO.URL}`);
    console.log('---');

    try {
        const video = await youtubeService.importVideo(userId, YOUTUBE_TEST_VIDEO.URL);
        console.log('✅ THÀNH CÔNG!');
        console.log(`ID nội bộ: ${video.id}`);
        console.log(`Status: ${video.status}`);

        console.log('\n--- Kiểm tra Transcript ---');
        // Ở đây chúng ta có thể gọi DB để check xem bao nhiêu segment đã được lưu
    } catch (error: any) {
        console.error('❌ THẤT BẠI:', error.message);
    }
}

testYouTubeImport();
