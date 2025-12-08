
import { sentenceService } from '../src/features/sentence/service';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function analyzeRealTranscript() {
    const text = "でもほとんどの家は同じような作りの家ですね。"; // Câu thật tại 6:01 của video Shirakawago

    console.log(`🎬 Phân tích câu thật tại mốc 6:01 của video Shirakawago:`);
    console.log(`"${text}"`);
    console.log('---');

    try {
        const result = await sentenceService.analyze(text);
        console.log('✅ KẾT QUẢ PHÂN TÍCH (OpenAI + Supabase):');
        console.log(`Dịch: ${result.translation}`);
        console.log(`Độ bao phủ (Biết bao nhiêu từ trong DB): ${result.coverage_stats.percentage}%`);
        console.log('Ngữ pháp:', result.grammar_points.map(g => g.title).join(', '));

        const inCKB = result.units.filter(u => u.is_in_ckb);
        console.log(`Từ vựng đã có trong 8000 từ của bạn: ${inCKB.map(u => u.surface).join(', ')}`);

    } catch (error: any) {
        console.error('❌ Lỗi:', error.message);
    }
}

analyzeRealTranscript();
