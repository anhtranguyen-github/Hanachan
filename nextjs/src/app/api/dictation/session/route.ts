import { NextRequest, NextResponse } from 'next/server';

// Get FastAPI backend URL from environment
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

// Create a new dictation session
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        
        // Forward to FastAPI backend
        const response = await fetch(`${FASTAPI_URL}/api/v1/dictation/session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Forward the authorization header if present
                ...(req.headers.get('authorization') && {
                    'Authorization': req.headers.get('authorization')!,
                }),
            },
            body: JSON.stringify(body),
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to create session' }));
            return NextResponse.json(
                { success: false, error: error.detail || 'Failed to create session' },
                { status: response.status }
            );
        }
        
        const data = await response.json();
        return NextResponse.json(data);
        
    } catch (e: any) {
        console.error('[Dictation Session API]', e);
        return NextResponse.json(
            { success: false, error: e.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
