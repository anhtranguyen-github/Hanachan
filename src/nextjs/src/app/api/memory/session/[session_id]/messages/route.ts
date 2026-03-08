import { NextRequest, NextResponse } from 'next/server';
import { AGENTS_BASE_URL } from '@/config/env';
import { getBearerFromCookieHeader, getBearerFromSupabaseCookie } from '../../../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, ctx: { params: { session_id: string } }) {
  const bearer =
    req.headers.get('authorization') ||
    getBearerFromCookieHeader(req.headers.get('cookie')) ||
    (await getBearerFromSupabaseCookie());
  if (!bearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { session_id } = ctx.params;
  const upstreamUrl = new URL(
    `${AGENTS_BASE_URL}/api/v1/history/thread/${encodeURIComponent(session_id)}/messages`,
  );

  const limit = req.nextUrl.searchParams.get('limit');
  if (limit) upstreamUrl.searchParams.set('limit', limit);

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { Authorization: bearer },
      cache: 'no-store',
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      console.error('[BFF] Session Messages Upstream Error:', upstream.status, text);
    }

    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
    });
  } catch (err) {
    console.error('[BFF] Session Messages Proxy Exception:', err);
    return NextResponse.json({ error: 'Upstream service unavailable' }, { status: 502 });
  }
}
