
import 'dotenv/config';
import { kuRepository } from './db';

async function seed() {
    console.log('🌱 Seeding sample Knowledge Units...');

    const samples = [
        {
            slug: 'kanji:猫',
            type: 'kanji' as const,
            character: '猫',
            meaning: 'Cat',
            level: 1,
            details: {
                meaning_data: { primary: 'Cat' },
                reading_data: { on: ['ビョウ'], kun: ['ねこ'] }
            }
        },
        {
            slug: 'vocabulary:食べる',
            type: 'vocabulary' as const,
            character: '食べる',
            meaning: 'To eat',
            level: 1,
            details: {
                reading_primary: 'たべる',
                meaning_data: { primary: 'To eat' }
            }
        },
        {
            slug: 'grammar:desu',
            type: 'grammar' as const,
            character: 'です',
            meaning: 'To be (polite)',
            level: 1,
            details: {
                title: 'です',
                meaning_summary: 'Polite version of "to be".'
            }
        }
    ];

    for (const s of samples) {
        try {
            await kuRepository.createKnowledgeUnit(s);
            console.log(`✅ Created KU: ${s.slug}`);
        } catch (err) {
            console.error(`❌ Failed to create KU: ${s.slug}`, err);
        }
    }

    console.log('✅ Seeding complete.');
}

seed().catch(console.error);
