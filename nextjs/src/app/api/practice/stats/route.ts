/**
 * Practice Stats API
 * Get speaking practice statistics for the current user
 * 
 * Architecture: Next.js BFF pattern - all business logic in Next.js
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getPracticeStats } from '@/features/speaking/speakingService';

export const dynamic = 'force-dynamic';

/**
 * GET /api/practice/stats
 * Get speaking practice statistics
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

        // Get stats using local service
        const stats = await getPracticeStats(user.id);

        return NextResponse.json({
            success: true,
            stats
        });

    } catch (error: any) {
        console.error('[Practice Stats API]', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
