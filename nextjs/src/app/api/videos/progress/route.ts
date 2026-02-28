// GET /api/videos/progress?video_id=xxx - Get progress for a video
// POST /api/videos/progress - Update video progress

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getVideoProgress, updateVideoProgress } from '@/features/video/service';

async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  if (!token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('video_id');

    if (!videoId) {
      return NextResponse.json({ error: 'video_id is required' }, { status: 400 });
    }

    const progress = await getVideoProgress(userId, videoId);
    return NextResponse.json({ progress });
  } catch (error: any) {
    console.error('[API/videos/progress] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
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
  } catch (error: any) {
    console.error('[API/videos/progress] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
