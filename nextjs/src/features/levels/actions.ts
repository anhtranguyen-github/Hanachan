'use server';

import { supabase } from '@/lib/supabase';

export async function getUserLevelsAction(userId: string) {
    try {
        const { data: profile } = await supabase.from('users').select('level').eq('id', userId).single();
        const currentLevel = profile?.level || 1;

        // Mocking level list for now to satisfy the UI
        const levels = Array.from({ length: 60 }, (_, i) => ({
            id: `level-${i + 1}`,
            name: `Level ${i + 1}`,
            description: `Master items from level ${i + 1}`,
            level: i + 1,
            stats: {
                coverage: 0,
                composition: { vocab: 0, kanji: 0, radical: 0 },
                flashcardTypes: {},
                masteryLevels: [],
                sentenceCoverage: { primary: 0, secondary: 0 },
                new: 0, learning: 0, due: 0, burned: 0, total: 0
            }
        }));

        return { success: true, data: levels };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
