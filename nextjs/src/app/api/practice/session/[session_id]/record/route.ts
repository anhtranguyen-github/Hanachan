/**
 * Practice Record API
 * Records a pronunciation attempt
 * 
 * Architecture: Next.js BFF pattern - all business logic in Next.js
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recordPracticeAttempt } from '@/features/speaking/speakingService';

export const dynamic = 'force-dynamic';

/**
 * POST /api/practice/session/{session_id}/record
 * Record a pronunciation attempt
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
        const { sentence, word, score } = body;

        if (!sentence || !word || score === undefined) {
            return NextResponse.json(
                { success: false, error: 'sentence, word, and score are required' },
                { status: 400 }
            );
        }

        // Record attempt using local service
        const result = await recordPracticeAttempt(user.id, sessionId, sentence, word, score);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            attempt: result.attempt
        });

    } catch (error: unknown) {
        console.error('[Practice Record API]', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
