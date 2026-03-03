/**
 * FSRS Review Submission API
 * Submit a review rating for an item
 * 
 * Architecture: Next.js BFF pattern - all business logic in Next.js
 * URL: /api/fsrs/review/{item_type}/{item_id}
 */

import { NextRequest, NextResponse } from 'next/server';
import { fsrsService, Rating } from '@/features/learning/services/fsrsService';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * POST /api/fsrs/review/{item_type}/{item_id}
 * Submit a review for an item
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { params: string[] } }
) {
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

        // Parse URL parameters: /api/fsrs/review/{item_type}/{item_id}
        const [itemType, itemId] = params.params;
        
        if (!itemType || !itemId) {
            return NextResponse.json(
                { success: false, error: 'Missing item_type or item_id' },
                { status: 400 }
            );
        }

        // Parse body
        const body = await req.json();
        const { rating, facet = 'meaning' } = body;

        if (!rating || rating < 1 || rating > 4) {
            return NextResponse.json(
                { success: false, error: 'Invalid rating. Must be 1-4 (Again, Hard, Good, Easy)' },
                { status: 400 }
            );
        }

        // Submit review through FSRS service
        const result = await fsrsService.submitReview(
            user.id,
            itemId,
            itemType,
            rating as Rating,
            facet
        );

        return NextResponse.json({
            success: true,
            result
        });

    } catch (error: any) {
        console.error('[FSRS Review API]', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
