'use server';

import { createClient } from "@/services/supabase/server";
import { revalidatePath } from "next/cache";

export async function seedDatabaseAction() {
    const supabase = createClient();

    const mockKUs = [
        {
            slug: 'kanji/三',
            character: '三',
            type: 'kanji',
            level: 1,
            meaning: 'Three',
            search_key: 'three',
            details: {
                meaning_data: { meanings: ['Three'] },
                reading_data: { onyomi: ['サン'], kunyomi: ['み', 'みっ'] },
                metadata: { meaning_mnemonic: 'Think of three lines.', reading_mnemonic: 'San sounds like sun.' }
            }
        },
        {
            slug: 'vocabulary/一人',
            character: '一人',
            type: 'vocabulary',
            level: 1,
            meaning: 'One Person',
            search_key: 'alone',
            details: {
                reading_primary: 'ひとり',
                meaning_data: { meanings: ['One Person', 'Alone'] },
                metadata: { meaning_mnemonic: 'One person standing alone.', reading_mnemonic: 'Hitori is lonely.' }
            }
        },
        {
            slug: 'grammar/かろう',
            character: '〜かろう',
            type: 'grammar',
            level: 10,
            meaning: 'Probably / Is likely',
            search_key: 'karou',
            details: {
                title: '〜かろう',
                meaning_summary: 'Literary/formal way to express probability for i-adjectives.',
                meaning_story: 'Derived from "ku arou". Used in formal context.',
                structure_json: 'i-adj (base) + かろう',
                metadata: {
                    examples: [
                        { japanese: '良かろう。', english: 'It should be fine.' },
                        { japanese: '寒かろう。', english: 'It must be cold.' }
                    ]
                }
            }
        },
        {
            slug: 'radical/tree',
            character: '木',
            type: 'radical',
            level: 1,
            meaning: 'Tree',
            search_key: 'tree',
            details: {
                name: 'Tree',
                meaning_story: 'This radical looks like a tree with branches and roots.'
            }
        }
    ];

    for (const item of mockKUs) {
        // Insert Knowledge Unit Base
        const { data: ku, error: kuErr } = await supabase
            .from('knowledge_units')
            .upsert({
                slug: item.slug,
                character: item.character,
                type: item.type,
                level: item.level,
                meaning: item.meaning,
                search_key: item.search_key
            })
            .select()
            .single();

        if (kuErr) {
            console.error(`Error seeding KU ${item.slug}:`, kuErr);
            continue;
        }

        // Insert Type-Specific Details
        let detailTable = '';
        const detailData: any = { ku_id: item.slug };

        if (item.type === 'kanji') {
            detailTable = 'ku_kanji';
            Object.assign(detailData, {
                character: item.character,
                meaning_data: item.details.meaning_data,
                reading_data: item.details.reading_data,
                metadata: item.details.metadata
            });
        } else if (item.type === 'vocabulary') {
            detailTable = 'ku_vocabulary';
            Object.assign(detailData, {
                character: item.character,
                reading_primary: item.details.reading_primary,
                meaning_data: item.details.meaning_data,
                metadata: item.details.metadata
            });
        } else if (item.type === 'grammar') {
            detailTable = 'ku_grammar';
            Object.assign(detailData, {
                title: item.details.title,
                meaning_summary: item.details.meaning_summary,
                meaning_story: item.details.meaning_story,
                structure_json: item.details.structure_json,
                metadata: item.details.metadata
            });
        } else if (item.type === 'radical') {
            detailTable = 'ku_radicals';
            Object.assign(detailData, {
                character: item.character,
                name: item.details.name,
                meaning_story: item.details.meaning_story
            });
        }

        if (detailTable) {
            const { error: detailErr } = await supabase
                .from(detailTable)
                .upsert(detailData);

            if (detailErr) console.error(`Error seeding detail for ${item.slug}:`, detailErr);
        }
    }

    revalidatePath('/');
    return { success: true };
}
