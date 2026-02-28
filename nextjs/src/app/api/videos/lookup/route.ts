// GET /api/videos/lookup?word=xxx - Look up a word from subtitle click

import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';
import { lookupWord } from '@/features/video/service';

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
