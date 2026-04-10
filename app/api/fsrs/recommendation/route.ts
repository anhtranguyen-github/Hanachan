/**
 * FSRS Recommendation API
 * Returns a recommendation for whether to teach new content or review
 * 
 * Architecture: Next.js BFF pattern - all business logic in Next.js
 */

import { NextRequest, NextResponse } from 'next/server';
import { fsrsService } from '@/features/learning/services/fsrsService';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fsrs/recommendation
 * Get learning recommendation (teach, review, or mixed)
 */
export async function GET(req: NextRequest) {
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

        // Get recommendation from FSRS service
        const { action, details } = await fsrsService.shouldTeachOrReview(user.id);

        return NextResponse.json({
            success: true,
            action,
            details,
            timestamp: new Date().toISOString()
        });

    } catch (error: unknown) {
        console.error('[FSRS Recommendation API]', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
