
import React from 'react';
import { knowledgeService } from '@/features/knowledge';
import { getUserLearningStates } from '@/features/learning/db';
import { ContentListView } from '@/features/knowledge/components/ContentListView';
import { createClient } from '@/services/supabase/server';

export default async function RadicalsPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch all radicals at once for high performance browsing
    const allItems = await knowledgeService.getAllByType('radical');

    // Group by level
    const levelData: any = {};
    allItems.forEach(item => {
        if (!levelData[item.level]) {
            levelData[item.level] = { level: item.level, items: [], total: 0 };
        }
        levelData[item.level].items.push(item);
        levelData[item.level].total++;
    });

    const srsStatus = user ? await getUserLearningStates(user.id) : {};

    return (
        <ContentListView
            type="RADICAL"
            title="Radicals"
            subtitle="The building blocks of Kanji"
            accentColor="#00AAFF" // Radical blue from design.config.ts
            initialDifficulty="N5"
            initialLevelData={levelData}
            initialSrsStatus={srsStatus}
        />
    );
}
