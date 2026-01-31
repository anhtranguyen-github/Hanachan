import { NextRequest, NextResponse } from 'next/server';
import { hanachan } from '@/features/chat/advanced-chatbot';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, history, userId, sessionId } = body;

        // HanachanChatService uses sessionId for state management
        const response = await hanachan.process(sessionId || 'default-session', userId, message);

        return NextResponse.json({
            success: true,
            reply: response.reply,
            toolsUsed: response.toolsUsed,
            referencedKUs: response.referencedKUs
        });

    } catch (e: any) {
        console.error("Chat Error", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
