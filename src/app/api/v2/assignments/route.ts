import { NextRequest, NextResponse } from 'next/server';
import { wanikaniApiService } from '@/features/learning/services/wanikaniApiService';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v2/assignments
 * WaniKani-compatible endpoint to list assignments.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    
    const immediatelyAvailableForLessons = searchParams.get('immediately_available_for_lessons') === 'true';
    const immediatelyAvailableForReview = searchParams.get('immediately_available_for_review') === 'true';
    const subjectIds = searchParams.get('subject_ids')?.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    const levels = searchParams.get('levels')?.split(',').map(l => parseInt(l, 10)).filter(l => !isNaN(l));

    const assignments = await wanikaniApiService.listAssignments(user.id, {
      immediately_available_for_lessons: immediatelyAvailableForLessons,
      immediately_available_for_review: immediatelyAvailableForReview,
      subject_ids: subjectIds,
      levels
    });

    return NextResponse.json(assignments);
  } catch (error: any) {
    console.error('[Assignments API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
