
import { sentenceService } from '../src/features/sentence/service';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runAnalysis() {
    const text = "毎日少しずつ勉強すれば、必ず上達します。";

    console.log(`🔍 Input: "${text}"`);
    console.log('--- Đang gọi SentenceService.analyze()... ---');

    try {
        const result = await sentenceService.analyze(text);
        console.log(JSON.stringify(result, null, 2));
    } catch (error: any) {
        console.error('❌ Lỗi:', error.message);
    }
}

runAnalysis();
