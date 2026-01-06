import { NextRequest, NextResponse } from 'next/server';
import { chatAgent } from '@/features/chat/simple-agent';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { message, history } = body; // Prompt Pattern: Context History

        // In a real LangGraph setup, we would pass the "thread_id" here
        const response = await chatAgent.process(message, history);

        return NextResponse.json({
            success: true,
            reply: response.reply,
            toolsUsed: response.toolsUsed
        });

    } catch (e: any) {
        console.error("Chat Error", e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
