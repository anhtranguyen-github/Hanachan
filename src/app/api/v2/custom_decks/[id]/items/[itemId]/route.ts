import { NextResponse } from 'next/server';
import { wanikaniApiService } from '@/features/learning/services/wanikaniApiService';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string, itemId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deckId = params.id;
    const itemId = params.itemId;
    
    await wanikaniApiService.removeDeckItem(user.id, deckId, itemId);
    
    return new Response(null, { status: 204 });
  } catch (error: any) {
    console.error('Error removing deck item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
