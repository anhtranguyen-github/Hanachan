/**
 * /api/chat/stream — Next.js streaming chat route.
 *
 * Proxies SSE from the memory API service, adding Hanachan-specific
 * context (system prompt, intent routing) before forwarding.
 *
 * The response is a plain `text/event-stream` that the client reads
 * via the Web Streams API or EventSource.
 *
 * Event types emitted:
 *   { type: 'context',  episodic, semantic, thread }
 *   { type: 'token',    content: '...' }
 *   { type: 'done',     session_id }
 *   { type: 'error',    message }
 */

import { NextRequest } from 'next/server';
import { AGENTS_BASE_URL } from '@/config/env';
import { getBearerFromCookieHeader, getBearerFromSupabaseCookie } from '../../memory/_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const body = await req.json();
    const message = body.message;
    const userId = body.userId || body.user_id;
    const sessionId = body.sessionId || body.session_id;
    const ttsEnabled = body.ttsEnabled ?? body.tts_enabled;

    if (!message || !userId) {
        console.error('[BFF] Missing message or userId:', { message: !!message, userId: !!userId });
        return new Response(
            `data: ${JSON.stringify({ type: 'error', message: 'message and userId are required' })}\n\n`,
            { status: 400, headers: { 'Content-Type': 'text/event-stream' } },
        );
    }

    let authHeader = req.headers.get('authorization');
    if (authHeader) console.log('[BFF] Auth from header');
    
    if (!authHeader) {
        authHeader = getBearerFromCookieHeader(req.headers.get('cookie'));
        if (authHeader) console.log('[BFF] Auth from cookie header');
    }

    if (!authHeader) {
        authHeader = await getBearerFromSupabaseCookie();
        if (authHeader) console.log('[BFF] Auth from supabase cookie store');
    }

    if (!authHeader?.startsWith('Bearer ')) {
        console.error('[BFF] Auth failed: No bearer token found');
        return new Response(
            `data: ${JSON.stringify({ type: 'error', message: 'Authorization Bearer token required' })}\n\n`,
            { status: 401, headers: { 'Content-Type': 'text/event-stream' } },
        );
    }

    // Ensure we have a session for thread continuity
    let resolvedSessionId: string | undefined = sessionId;

    try {
        const baseUrl = AGENTS_BASE_URL;
        const upstreamRes = await fetch(`${baseUrl}/api/v1/chat/stream`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader,
            },
            body: JSON.stringify({
                user_id: userId,
                message,
                session_id: resolvedSessionId,
                tts_enabled: ttsEnabled,
            }),
            cache: 'no-store',
        });

        if (!upstreamRes.ok || !upstreamRes.body) {
            const errText = await upstreamRes.text().catch(() => '');
            console.error('[BFF] Upstream error:', upstreamRes.status, errText);
            const errEvent = `data: ${JSON.stringify({ type: 'error', message: `Upstream error: ${upstreamRes.status} ${errText}`.trim() })}\n\n`;
            return new Response(errEvent, { status: 502, headers: { 'Content-Type': 'text/event-stream' } });
        }

        // Pipe the upstream SSE stream directly to the client
        // Inject session_id into the 'done' event via a TransformStream
        const encoder = new TextEncoder();
        let buffer = '';

        const transform = new TransformStream<Uint8Array, Uint8Array>({
            transform(chunk, controller) {
                buffer += new TextDecoder().decode(chunk);
                const lines = buffer.split('\n\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) {
                        controller.enqueue(encoder.encode(line + '\n\n'));
                        continue;
                    }
                    const rawJson = line.slice(6);
                    try {
                        const parsed = JSON.parse(rawJson);
                        // Attach session_id to done event
                        if (parsed.type === 'done') {
                            parsed.session_id = resolvedSessionId;
                        }
                        controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`),
                        );
                    } catch {
                        controller.enqueue(encoder.encode(line + '\n\n'));
                    }
                }
            },
            flush(controller) {
                if (buffer) {
                    controller.enqueue(encoder.encode(buffer));
                }
            },
        });

        return new Response(upstreamRes.body.pipeThrough(transform), {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive',
                'X-Memory-Session-Id': resolvedSessionId ?? '',
            },
        });
    } catch (err: unknown) {
        console.error('[BFF] Stream Proxy Exception:', err);
        const errEvent = `data: ${JSON.stringify({ type: 'error', message: (err instanceof Error ? err.message : String(err)) })}\n\n`;
        return new Response(errEvent, {
            status: 502,
            headers: { 'Content-Type': 'text/event-stream' },
        });
    }
}
