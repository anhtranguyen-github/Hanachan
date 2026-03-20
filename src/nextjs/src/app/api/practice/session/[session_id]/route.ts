/**
 * Practice Session Management API
 * Handles GET (next item), POST (record attempt), and DELETE (end session)
 * 
 * Architecture: Next.js BFF pattern - all business logic in Next.js
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { recordPracticeAttempt, endPracticeSession, getPracticeStats } from '@/features/speaking/speakingService';
import { getBearerFromCookieHeader, getBearerFromSupabaseCookie } from '../../../memory/_auth';

export const dynamic = 'force-dynamic';


/**
 * GET /api/practice/session/{session_id}
 * Get next practice item (simplified - returns session info)
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { session_id: string } }
) {
    try {
        const sessionId = params.session_id;

        // Get user from authorization header or cookies
        const authHeader = req.headers.get('authorization') || 
                          getBearerFromCookieHeader(req.headers.get('cookie')) ||
                          (await getBearerFromSupabaseCookie());
                          
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
                },
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
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

        // Get session details
        const { data: session, error: sessionError } = await supabase
            .from('speaking_sessions')
            .select('*')
            .eq('id', sessionId)
            .eq('user_id', user.id)
            .single();

        if (sessionError || !session) {
            return NextResponse.json(
                { success: false, error: 'Session not found' },
                { status: 404 }
            );
        }

        // Get sentences for this session (would be stored in session data)
        const { data: sentences } = await supabase
            .from('sentences')
            .select('*')
            .limit(10);

        return NextResponse.json({
            success: true,
            session,
            sentences: sentences || []
        });

    } catch (error: unknown) {
        console.error('[Practice Session GET API]', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/practice/session/{session_id}
 * Record a practice attempt
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { session_id: string } }
) {
    try {
        const sessionId = params.session_id;

        // Get user from authorization header or cookies
        const authHeader = req.headers.get('authorization') || 
                          getBearerFromCookieHeader(req.headers.get('cookie')) ||
                          (await getBearerFromSupabaseCookie());
                          
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
                },
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
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
        const result = await recordPracticeAttempt(user.id, sessionId, sentence, word, score, supabase);


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
        console.error('[Practice Session POST API]', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/practice/session/{session_id}
 * End a practice session
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { session_id: string } }
) {
    try {
        const sessionId = params.session_id;

        // Get user from authorization header or cookies
        const authHeader = req.headers.get('authorization') || 
                          getBearerFromCookieHeader(req.headers.get('cookie')) ||
                          (await getBearerFromSupabaseCookie());
                          
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
                },
                global: {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
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

        // End session using local service
        const result = await endPracticeSession(user.id, sessionId, supabase);


        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true
        });

    } catch (error: unknown) {
        console.error('[Practice Session DELETE API]', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
