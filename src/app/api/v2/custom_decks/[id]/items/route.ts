import { NextResponse } from 'next/server';
import { wanikaniApiService } from '@/features/learning/services/wanikaniApiService';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deckId = params.id;
    const result = await wanikaniApiService.listDeckItems(user.id, deckId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error listing deck items:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deckId = params.id;
    const { subject_id, custom_level } = await request.json();
    const result = await wanikaniApiService.addDeckItem(user.id, deckId, subject_id, custom_level);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error adding deck item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
