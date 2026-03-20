/**
 * Dictation Session API
 * Creates a new dictation session for a video
 * 
 * Architecture: Next.js BFF pattern - all business logic in Next.js
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createDictationSession } from '@/features/video/dictationService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/dictation/session
 * Create a new dictation session
 */
export async function POST(req: NextRequest) {
    try {
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
        const { video_id, settings } = body;

        if (!video_id) {
            return NextResponse.json(
                { success: false, error: 'video_id is required' },
                { status: 400 }
            );
        }

        // Create session using local service
        const result = await createDictationSession(user.id, video_id, settings);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            session_id: result.session?.id,
            session: result.session,
            subtitles: result.subtitles
        });

    } catch (error: unknown) {
        console.error('[Dictation Session API]', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
