import { NextRequest, NextResponse } from 'next/server';
import { advancedChatService } from '@/features/chat/advanced-chatbot';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, userId, sessionId } = body;

        if (!message || !userId) {
            return NextResponse.json({ success: false, error: 'message and userId are required' }, { status: 400 });
        }

        const response = await advancedChatService.sendMessage(
            sessionId ?? crypto.randomUUID(),
            userId,
            message,
        );

        return NextResponse.json({
            success: true,
            reply: response.reply,
            actions: response.actions,
            referencedUnits: response.referencedKUs,
            toolsUsed: [],
        });

    } catch (e: any) {
        console.error('[Chat API]', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
