import { NextRequest, NextResponse } from 'next/server';
import { wanikaniApiService } from '@/features/learning/services/wanikaniApiService';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v2/subjects
 * WaniKani-compatible endpoint to list subjects.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const ids = searchParams.get('ids')?.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    const types = searchParams.get('types')?.split(',');
    const levels = searchParams.get('levels')?.split(',').map(l => parseInt(l, 10)).filter(l => !isNaN(l));
    const slugs = searchParams.get('slugs')?.split(',');
    const pageAfterId = searchParams.get('page_after_id') ? parseInt(searchParams.get('page_after_id')!, 10) : undefined;

    const subjects = await wanikaniApiService.listSubjects({
      ids,
      types,
      levels,
      slugs,
      page_after_id: pageAfterId
    });

    return NextResponse.json(subjects);
  } catch (error: any) {
    console.error('[Subjects API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
