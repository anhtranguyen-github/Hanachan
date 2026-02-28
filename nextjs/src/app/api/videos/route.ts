// GET /api/videos - Search videos
// POST /api/videos - Add a new video (by YouTube ID)

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { searchVideos, getOrCreateVideo } from '@/features/video/service';

function getSupabaseFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const jlptLevel = searchParams.get('jlpt') ? parseInt(searchParams.get('jlpt')!) : undefined;

    const videos = await searchVideos(query, jlptLevel);
    return NextResponse.json({ videos });
  } catch (error: any) {
    console.error('[API/videos] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { youtube_id } = body;

    if (!youtube_id) {
      return NextResponse.json({ error: 'youtube_id is required' }, { status: 400 });
    }

    const video = await getOrCreateVideo(youtube_id);
    return NextResponse.json({ video });
  } catch (error: any) {
    console.error('[API/videos] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
