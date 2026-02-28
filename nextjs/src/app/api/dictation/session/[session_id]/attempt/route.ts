import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

// Submit a dictation attempt
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ session_id: string }> }
) {
    try {
        const { session_id } = await params;
        const body = await req.json();
        
        const response = await fetch(
            `${FASTAPI_URL}/api/v1/dictation/session/${session_id}/attempt`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(req.headers.get('authorization') && {
                        'Authorization': req.headers.get('authorization')!,
                    }),
                },
                body: JSON.stringify({
                    session_id,
                    ...body,
                }),
            }
        );
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to submit attempt' }));
            return NextResponse.json(
                { success: false, error: error.detail || 'Failed to submit attempt' },
                { status: response.status }
            );
        }
        
        const data = await response.json();
        return NextResponse.json(data);
        
    } catch (e: any) {
        console.error('[Dictation Attempt API]', e);
        return NextResponse.json(
            { success: false, error: e.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
