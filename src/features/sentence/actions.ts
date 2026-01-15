'use server';

import { sentenceService, FullAnalysisResult } from './service';

export async function analyzeSentenceAction(text: string): Promise<{ success: boolean; data?: FullAnalysisResult; error?: string }> {
    try {
        if (!text || text.trim().length === 0) {
            return { success: false, error: "Please enter a sentence." };
        }

        const result = await sentenceService.analyze(text);

        return { success: true, data: result };
    } catch (e: any) {
        console.error("Analysis Failed", e);
        return { success: false, error: "Failed to analyze sentence. " + e.message };
    }
}
export async function mineSentenceAction(text: string) {
    const result = await sentenceService.mine(text, '00000000-0000-0000-0000-000000000001');
    return result;
}

export async function fetchMinedSentencesAction() {
    // Return mock mined sentences
    return [
        {
            id: 'mock-s-1',
            text_ja: '猫は魚が好きです。',
            text_en: 'Cats like fish.',
            source_type: 'manual',
            created_at: new Date().toISOString(),
            user_sentence_cards: [
                { front: '猫', back: 'Cat' }
            ]
        }
    ];
}
