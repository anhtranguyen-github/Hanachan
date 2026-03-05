// GET /api/videos - Search videos
// POST /api/videos - Add a new video (by YouTube ID)

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { searchVideos, getOrCreateVideo } from '@/features/video/service';
import { z } from 'zod';

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

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = getSupabase(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const jlptLevel = searchParams.get('jlpt') ? parseInt(searchParams.get('jlpt')!) : undefined;

    const videos = await searchVideos(query, jlptLevel);
    return NextResponse.json({ videos });
  } catch (error: unknown) {
    console.error('[API/videos] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = getSupabase(cookieStore);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const schema = z.object({
      youtube_id: z.string().min(1, 'youtube_id is required').max(50)
    });

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { youtube_id } = parsed.data;

    const video = await getOrCreateVideo(youtube_id);
    return NextResponse.json({ video });
  } catch (error: unknown) {
    console.error('[API/videos] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
