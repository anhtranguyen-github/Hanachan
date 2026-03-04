// GET /api/videos/lookup?word=xxx - Look up a word from subtitle click

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { lookupWord } from '@/features/video/service';

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
    const { searchParams } = new URL(req.url);
    const word = searchParams.get('word');

    if (!word) {
      return NextResponse.json({ error: 'word is required' }, { status: 400 });
    }

    const result = await lookupWord(word, userId || undefined);
    return NextResponse.json({ result });
  } catch (error: any) {
    console.error('[API/videos/lookup] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
