// GET /api/videos/progress?video_id=xxx - Get progress for a video
// POST /api/videos/progress - Update video progress

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getVideoProgress, updateVideoProgress } from '@/features/video/service';

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
    const videoId = searchParams.get('video_id');

    if (!videoId) {
      return NextResponse.json({ error: 'video_id is required' }, { status: 400 });
    }

    const progress = await getVideoProgress(userId, videoId);
    return NextResponse.json({ progress });
  } catch (error: unknown) {
    console.error('[API/videos/progress] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { video_id, last_position_ms, progress_percent, completed } = body;

    if (!video_id) {
      return NextResponse.json({ error: 'video_id is required' }, { status: 400 });
    }

    const progress = await updateVideoProgress(userId, {
      video_id,
      last_position_ms: last_position_ms || 0,
      progress_percent: progress_percent || 0,
      completed,
    });

    return NextResponse.json({ progress });
  } catch (error: unknown) {
    console.error('[API/videos/progress] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}