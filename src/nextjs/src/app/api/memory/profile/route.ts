import { NextRequest, NextResponse } from 'next/server';
import { AGENTS_BASE_URL } from '@/config/env';
import { getBearerFromCookieHeader, getBearerFromSupabaseCookie } from '../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const bearer =
    req.headers.get('authorization') ||
    getBearerFromCookieHeader(req.headers.get('cookie')) ||
    (await getBearerFromSupabaseCookie());

  if (!bearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const url = `${AGENTS_BASE_URL}/api/v1/memory/profile`;
    console.log('[BFF] fetching profile memories:', url);
    const upstream = await fetch(url, {
      headers: { Authorization: bearer },
      cache: 'no-store',
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      console.error('[BFF] Profile Mem Upstream Error:', upstream.status, text);
    }
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
    });
  } catch (err) {
    console.error('[BFF] Profile Mem Proxy Exception:', err);
    return NextResponse.json({ error: 'Upstream service unavailable' }, { status: 502 });
  }
}
