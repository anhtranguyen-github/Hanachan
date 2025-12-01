
import React from 'react';
import { knowledgeService } from '@/features/knowledge';
import { getUserLearningStates } from '@/features/learning/db';
import { ContentListView } from '@/features/knowledge/components/ContentListView';
import { createClient } from '@/services/supabase/server';

export default async function GrammarPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch all grammar at once for high performance browsing
    const allItems = await knowledgeService.getAllByType('grammar');

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
            type="GRAMMAR"
            title="Grammar"
            subtitle="The rules of the language"
            accentColor="#44BB00" // Grammar green from design.config.ts
            initialDifficulty="N5"
            initialLevelData={levelData}
            initialSrsStatus={srsStatus}
        />
    );
}
