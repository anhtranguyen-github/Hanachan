// GET /api/videos/library - Get user's video library
// POST /api/videos/library - Add video to library
// DELETE /api/videos/library - Remove video from library

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getUserLibrary, addToLibrary, removeFromLibrary } from '@/features/video/service';

export const dynamic = "force-dynamic";

function getSupabase(cookieStore: any) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
      },
    }
  );
}

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  const supabase = getSupabase(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('category_id') || undefined;
    const filterBy = searchParams.get('filter') as any || 'all';
    const sortBy = searchParams.get('sort') as any || 'date_added';
    const jlptLevel = searchParams.get('jlpt') ? parseInt(searchParams.get('jlpt')!) : undefined;
    const searchQuery = searchParams.get('q') || '';

    const entries = await getUserLibrary(userId, {
      categoryId,
      filterBy,
      sortBy,
      jlptLevel,
      searchQuery,
    });

    return NextResponse.json({ entries });
  } catch (error: any) {
    console.error('[API/videos/library] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { video_id, category_id, notes } = body;

    if (!video_id) {
      return NextResponse.json({ error: 'video_id is required' }, { status: 400 });
    }

    const entry = await addToLibrary(userId, { video_id, category_id, notes });
    return NextResponse.json({ entry });
  } catch (error: any) {
    console.error('[API/videos/library] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('video_id');

    if (!videoId) {
      return NextResponse.json({ error: 'video_id is required' }, { status: 400 });
    }

    await removeFromLibrary(userId, videoId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API/videos/library] DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}