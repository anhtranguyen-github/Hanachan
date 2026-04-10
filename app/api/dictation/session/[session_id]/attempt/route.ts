/**
 * Dictation Attempt API
 * Submit a dictation attempt
 * 
 * Architecture: Next.js BFF pattern - all business logic in Next.js
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { submitDictationAttempt } from '@/features/video/dictationService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/dictation/session/{session_id}/attempt
 * Submit a dictation attempt
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { session_id: string } }
) {
    try {
        const sessionId = params.session_id;

        // Get user from authorization header
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const token = authHeader.split(' ')[1];
        
        // Verify token with Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Parse body
        const body = await req.json();
        const { subtitle_id, user_input, time_taken_ms } = body;

        if (!subtitle_id || user_input === undefined) {
            return NextResponse.json(
                { success: false, error: 'subtitle_id and user_input are required' },
                { status: 400 }
            );
        }

        // Submit attempt using local service
        const result = await submitDictationAttempt(
            user.id,
            sessionId,
            subtitle_id,
            user_input,
            time_taken_ms || 0
        );

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            result: result.result
        });

    } catch (error: unknown) {
        console.error('[Dictation Attempt API]', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
