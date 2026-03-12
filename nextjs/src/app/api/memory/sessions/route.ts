import { NextRequest, NextResponse } from 'next/server';
import { getBearerFromCookieHeader, getBearerFromSupabaseCookie } from '../_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getAgentsBaseUrl() {
  const base =
    process.env.AGENTS_API_URL ||
    (process.env.MEMORY_API_URL ? process.env.MEMORY_API_URL.replace(/\/api\/v1\/?$/, '') : '') ||
    'http://127.0.0.1:8765';
  return base.replace(/\/+$/, '');
}

export async function GET(req: NextRequest) {
  const bearer =
    req.headers.get('authorization') ||
    getBearerFromCookieHeader(req.headers.get('cookie')) ||
    (await getBearerFromSupabaseCookie());
  if (!bearer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const upstream = await fetch(`${getAgentsBaseUrl()}/api/v1/memory/sessions`, {
      headers: { Authorization: bearer },
      cache: 'no-store',
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Upstream service unavailable' }, { status: 502 });
  }
}

