import { NextRequest, NextResponse } from 'next/server';
import { wanikaniApiService } from '@/features/learning/services/wanikaniApiService';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v2/summary
 * WaniKani-compatible endpoint to get a summary of available lessons/reviews.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summary = await wanikaniApiService.getSummary(user.id);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[Summary API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
