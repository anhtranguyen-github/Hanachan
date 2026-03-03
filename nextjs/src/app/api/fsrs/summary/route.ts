/**
 * FSRS Learning Summary API
 * Returns a summary of the user's learning state
 * 
 * Architecture: Next.js BFF pattern - all business logic in Next.js
 */

import { NextRequest, NextResponse } from 'next/server';
import { fsrsService } from '@/features/learning/services/fsrsService';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fsrs/summary
 * Get learning summary for the user
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

        // Get learning summary from FSRS service
        const summary = await fsrsService.getLearningSummary(user.id);

        return NextResponse.json({
            success: true,
            summary
        });

    } catch (error: any) {
        console.error('[FSRS Summary API]', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
