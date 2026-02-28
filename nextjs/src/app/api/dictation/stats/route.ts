import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

// Get dictation stats
export async function GET(req: NextRequest) {
    try {
        const response = await fetch(`${FASTAPI_URL}/api/v1/dictation/stats`, {
            method: 'GET',
            headers: {
                // Forward the authorization header if present
                ...(req.headers.get('authorization') && {
                    'Authorization': req.headers.get('authorization')!,
                }),
            },
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to get stats' }));
            return NextResponse.json(
                { success: false, error: error.detail || 'Failed to get stats' },
                { status: response.status }
            );
        }
        
        const data = await response.json();
        return NextResponse.json(data);
        
    } catch (e: any) {
        console.error('[Dictation Stats API]', e);
        return NextResponse.json(
            { success: false, error: e.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
