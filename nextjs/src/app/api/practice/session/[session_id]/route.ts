import { NextRequest, NextResponse } from 'next/server';

// Get FastAPI backend URL from environment
const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';

export const dynamic = 'force-dynamic';

// Get next practice item or record an attempt
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('session_id');
        
        if (!sessionId) {
            return NextResponse.json(
                { success: false, error: 'session_id is required' },
                { status: 400 }
            );
        }
        
        // Forward to FastAPI backend
        const response = await fetch(`${FASTAPI_URL}/api/v1/practice/session/${sessionId}/next`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(req.headers.get('authorization') && {
                    'Authorization': req.headers.get('authorization')!,
                }),
            },
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to get next item' }));
            return NextResponse.json(
                { success: false, error: error.detail || 'Failed to get next item' },
                { status: response.status }
            );
        }
        
        const data = await response.json();
        return NextResponse.json(data);
        
    } catch (e: any) {
        console.error('[Practice Next API]', e);
        return NextResponse.json(
            { success: false, error: e.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// Record an attempt
export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('session_id');
        
        if (!sessionId) {
            return NextResponse.json(
                { success: false, error: 'session_id is required' },
                { status: 400 }
            );
        }
        
        const body = await req.json();
        
        // Forward to FastAPI backend
        const response = await fetch(`${FASTAPI_URL}/api/v1/practice/session/${sessionId}/record`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(req.headers.get('authorization') && {
                    'Authorization': req.headers.get('authorization')!,
                }),
            },
            body: JSON.stringify({
                ...body,
                session_id: sessionId,
            }),
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to record attempt' }));
            return NextResponse.json(
                { success: false, error: error.detail || 'Failed to record attempt' },
                { status: response.status }
            );
        }
        
        const data = await response.json();
        return NextResponse.json(data);
        
    } catch (e: any) {
        console.error('[Practice Record API]', e);
        return NextResponse.json(
            { success: false, error: e.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

// Delete/end a session
export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get('session_id');
        
        if (!sessionId) {
            return NextResponse.json(
                { success: false, error: 'session_id is required' },
                { status: 400 }
            );
        }
        
        // Forward to FastAPI backend
        const response = await fetch(`${FASTAPI_URL}/api/v1/practice/session/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(req.headers.get('authorization') && {
                    'Authorization': req.headers.get('authorization')!,
                }),
            },
        });
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Failed to end session' }));
            return NextResponse.json(
                { success: false, error: error.detail || 'Failed to end session' },
                { status: response.status }
            );
        }
        
        const data = await response.json();
        return NextResponse.json(data);
        
    } catch (e: any) {
        console.error('[Practice End Session API]', e);
        return NextResponse.json(
            { success: false, error: e.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
