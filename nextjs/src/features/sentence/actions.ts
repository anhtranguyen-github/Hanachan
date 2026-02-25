'use server';

import { sentenceService, FullAnalysisResult } from './service';
import { sentenceRepository } from './db';

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
export async function getSentenceAction(id: string) {
    try {
        const sentence = await sentenceRepository.getById(id);
        return { success: true, data: sentence };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function fetchSentencesAction(userId: string) {
    try {
        const sentences = await sentenceRepository.getUserSentences(userId);
        return { success: true, data: sentences };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function createSentenceAction(data: any) {
    try {
        const result = await sentenceRepository.create(data);
        if (!result) {
            return { success: false, error: "Failed to create sentence." };
        }
        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function mineSentenceAction(userId: string, text: string, preAnalysis?: FullAnalysisResult) {
    try {
        const result = await sentenceService.mine(text, userId, preAnalysis);
        if (!result.success) {
            return { success: false, error: "Failed to create sentence record." };
        }
        return { success: true, data: result };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
