
'use server';

import { advancedChatService } from './advanced-chatbot';
import { chatRepo } from './chat-repo';

/**
 * Server Action to send a message to the AI.
 */
export async function sendMessageAction(sessionId: string, userId: string, content: string) {
    try {
        const reply = await advancedChatService.sendMessage(sessionId, userId, content);
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
export async function getUserSessionsAction(userId: string) {
    // We need a list sessions method in chatRepo
    // Assuming we have it or adding a placeholder
    return [];
}

export async function createSessionAction(sessionId: string, userId: string) {
    return await chatRepo.createSession(sessionId, userId);
}
