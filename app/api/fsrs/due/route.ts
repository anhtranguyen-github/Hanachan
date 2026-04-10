/**
 * FSRS Due Items API
 * Returns items due for review based on FSRS scheduling
 * 
 * Architecture: Next.js BFF pattern - all business logic in Next.js,
 * no forwarding to FastAPI for FSRS operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { fsrsService } from '@/features/learning/services/fsrsService';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/fsrs/due
 * Get items due for review
 */
export async function GET(req: NextRequest) {
    try {
        // Get user from authorization header (validated by Supabase in middleware)
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

        // Parse query parameters
        const { searchParams } = new URL(req.url);
        const itemType = searchParams.get('item_type') || undefined;
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        // Get due items from FSRS service
        const dueItems = await fsrsService.getDueItems(
            user.id,
            itemType,
            limit
        );

        return NextResponse.json({
            success: true,
            items: dueItems,
            total: dueItems.length,
            item_type_filter: itemType || null
        });

    } catch (error: unknown) {
        console.error('[FSRS Due API]', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
