
'use server';

import { advancedChatService } from './advanced-chatbot';
import { chatRepo } from './chat-repo';
import { createClient } from '@/services/supabase/server';

async function getAuthUser() {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        throw new Error('Unauthorized');
    }
    return user;
}

import { z } from 'zod';

/**
 * Server Action to send a message to the AI.
 */
export async function sendMessageAction(sessionId: string, content: string) {
    // 0. Validation
    z.string().min(1).parse(sessionId);
    z.string().min(1).parse(content);

    const user = await getAuthUser();
    if (process.env.E2E === 'true') {
        const lower = content.toLowerCase();

        if (lower.includes('quiz me') || lower.includes('start test')) {
            return {
                success: true,
                reply: '[QUIZ_MODE]\nWould you like to start a quiz?\nQ1: What is the meaning of 猫?\nA) Cat  B) Dog  C) Bird'
            };
        }

        if (lower.startsWith('analyze') || /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/.test(content)) {
            return {
                success: true,
                reply: '[ANALYZE_PROMPT]\nWould you like me to analyze this sentence?\n[ANALYSIS_RESULT]\n**Analysis Result** 🇯🇵\n\n**Original:** 猫が好き\n**Meaning:** I like cats.\n\n**Grammar:**\n- が: subject marker'
            };
        }

        if (lower.includes('save') || lower.includes('lưu') || lower.includes('add card')) {
            return {
                success: true,
                reply: '[ADD_CARD_PROMPT]\nI can save this for review.\n[ACTION_TRIGGER]: {"type":"TRIGGER_ADD_CARD_MODAL","name":"猫","description":"Vocabulary card"}'
            };
        }

        return {
            success: true,
            reply: 'Hello! How can I help you today?'
        };
    }

    try {
        const reply = await advancedChatService.sendMessage(sessionId, user.id, content);
        return { success: true, reply };
    } catch (error: any) {
        console.error("Chat Action Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Server Action to load session history.
 */
export async function getSessionHistoryAction(sessionId: string) {
    return await chatRepo.getSession(sessionId);
}

/**
 * Server Action to load all sessions for a user.
 */
export async function getUserSessionsAction() {
    const user = await getAuthUser();
    // We need a list sessions method in chatRepo
    return await chatRepo.getUserSessions(user.id);
}

export async function createSessionAction(sessionId: string) {
    const user = await getAuthUser();
    return await chatRepo.createSession(sessionId, user.id);
}
