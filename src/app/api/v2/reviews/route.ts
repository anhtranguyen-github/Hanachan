import { NextResponse } from 'next/server';
import { wanikaniApiService } from '@/features/learning/services/wanikaniApiService';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const result = await wanikaniApiService.submitReview(user.id, body);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
