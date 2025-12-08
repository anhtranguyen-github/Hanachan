
import { sentenceService } from '../src/features/sentence/service';
import dotenv from 'dotenv';
import path from 'path';

// Load môi trường thật
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function proveItIsReal() {
    const text = "君に揺られている"; // Một câu có ngữ pháp (Thể bị động/tiếp diễn)

    console.log(`🚀 Đang bắt đầu PHÂN TÍCH THẬT cho câu: "${text}"`);
    console.log('---');

    try {
        const result = await sentenceService.analyze(text);

        console.log('✅ 1. KẾT QUẢ TỪ OPENAI (Bản dịch & Ngữ pháp):');
        console.log(`Dịch: ${result.translation}`);
        console.log(`Giải thích: ${result.explanation}`);
        console.log('Ngữ pháp tìm thấy:', JSON.stringify(result.grammar_points, null, 2));

        console.log('\n✅ 2. KẾT QUẢ TỪ SUPABASE (Mapping kiến thức):');
        const inCKB = result.units.filter(u => u.is_in_ckb);
        if (inCKB.length > 0) {
            console.log(`Tìm thấy ${inCKB.length} từ trong kho kiến thức của bạn:`);
            inCKB.forEach(u => console.log(` - Từ: "${u.surface}" | Slug: "${u.ku_slug}"`));
        } else {
            console.log('Chưa tìm thấy từ này trong 1100 từ bạn đã seed (Có thể do slug chưa khớp).');
        }

        console.log('\n✅ 3. ĐỀ XUẤT ĐỤC LỖ (Cloze Suggestion):');
        console.log(`Vị trí các ký tự AI khuyên ẩn đi: ${result.cloze_positions}`);

    } catch (error: any) {
        console.error('❌ Thất bại:', error.message);
    }
}

proveItIsReal();
