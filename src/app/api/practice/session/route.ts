/**
 * Speaking Practice Session API
 * Creates and manages speaking practice sessions
 * 
 * Architecture: Next.js BFF pattern - all business logic in Next.js
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPracticeSession } from '@/features/speaking/speakingService';
import { z } from 'zod';
import { getBearerFromCookieHeader, getBearerFromSupabaseCookie } from '../../memory/_auth';


export const dynamic = 'force-dynamic';

/**
 * POST /api/practice/session
 * Create a new speaking practice session
 */
export async function POST(req: NextRequest) {
    try {
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

        const schema = z.object({
            target_difficulty: z.string().optional()
        });
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 });
        }
        const { target_difficulty } = parsed.data;

        // Create session using local service
        const result = await createPracticeSession(user.id, target_difficulty, supabase);


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
            sentences: result.sentences
        });

    } catch (error: unknown) {
        console.error('[Practice Session API]', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
