import { NextRequest, NextResponse } from 'next/server';
import { AGENTS_BASE_URL } from '@/config/env';
import { getBearerFromCookieHeader, getBearerFromSupabaseCookie } from '../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';



export async function POST(_req: NextRequest) {
  const bearer =
    _req.headers.get('authorization') ||
    getBearerFromCookieHeader(_req.headers.get('cookie')) ||
    (await getBearerFromSupabaseCookie());
  if (!bearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const upstream = await fetch(`${AGENTS_BASE_URL}/api/v1/memory/session`, {
      method: 'POST',
      headers: { Authorization: bearer },
      cache: 'no-store',
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      console.error('[BFF] Session Upstream Error:', upstream.status, text);
    }
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
    });
  } catch (err) {
    console.error('[BFF] Session Proxy Exception:', err);
    return NextResponse.json({ error: 'Upstream service unavailable' }, { status: 502 });
  }
}

