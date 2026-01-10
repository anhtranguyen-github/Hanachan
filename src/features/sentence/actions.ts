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

