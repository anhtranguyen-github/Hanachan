import { NextRequest, NextResponse } from 'next/server';
import { AGENTS_BASE_URL } from '@/config/env';
import { getBearerFromCookieHeader, getBearerFromSupabaseCookie } from '../../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';



export async function GET(_req: NextRequest, ctx: { params: { session_id: string } }) {
  const bearer =
    _req.headers.get('authorization') ||
    getBearerFromCookieHeader(_req.headers.get('cookie')) ||
    (await getBearerFromSupabaseCookie());
  if (!bearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { session_id } = ctx.params;
  try {
    const upstream = await fetch(`${AGENTS_BASE_URL}/api/v1/history/thread/${encodeURIComponent(session_id)}`, {
      headers: { Authorization: bearer },
      cache: 'no-store',
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      console.error('[BFF] Session Details Upstream Error:', upstream.status, text);
    }
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
    });
  } catch (err) {
    console.error('[BFF] Session Details Proxy Exception:', err);
    return NextResponse.json({ error: 'Upstream service unavailable' }, { status: 502 });
  }
}

export async function PATCH(req: NextRequest, ctx: { params: { session_id: string } }) {
  const bearer =
    req.headers.get('authorization') ||
    getBearerFromCookieHeader(req.headers.get('cookie')) ||
    (await getBearerFromSupabaseCookie());
  if (!bearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.text();
  const { session_id } = ctx.params;
  try {
    const upstream = await fetch(`${AGENTS_BASE_URL}/api/v1/history/thread/${encodeURIComponent(session_id)}`, {
      method: 'PATCH',
      headers: {
        Authorization: bearer,
        'Content-Type': req.headers.get('content-type') || 'application/json',
      },
      body,
      cache: 'no-store',
    });

    const text = await upstream.text();
    if (!upstream.ok) {
      console.error('[BFF] Session PATCH Upstream Error:', upstream.status, text);
    }
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
    });
  } catch (err) {
    console.error('[BFF] Session PATCH Proxy Exception:', err);
    return NextResponse.json({ error: 'Upstream service unavailable' }, { status: 502 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: { session_id: string } }) {
  const bearer =
    _req.headers.get('authorization') ||
    getBearerFromCookieHeader(_req.headers.get('cookie')) ||
    (await getBearerFromSupabaseCookie());
  if (!bearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { session_id } = ctx.params;

  // Fetch details first so callers can show title/summary after ending.
  try {
    const before = await fetch(`${AGENTS_BASE_URL}/api/v1/history/thread/${encodeURIComponent(session_id)}`, {
      headers: { Authorization: bearer },
      cache: 'no-store',
    });
    const beforeJson = before.ok ? await before.json().catch(() => null) : null;

    const upstream = await fetch(`${AGENTS_BASE_URL}/api/v1/history/thread/${encodeURIComponent(session_id)}`, {
      method: 'DELETE',
      headers: { Authorization: bearer },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return new NextResponse(text, {
        status: upstream.status,
        headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
      });
    }

    return NextResponse.json(
      {
        title: beforeJson?.title ?? null,
        summary: beforeJson?.summary ?? null,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[BFF] Session DELETE Proxy Exception:', err);
    return NextResponse.json({ error: 'Upstream service unavailable' }, { status: 502 });
  }
}

