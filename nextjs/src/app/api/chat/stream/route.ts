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
import { getBearerFromCookieHeader, getBearerFromSupabaseCookie } from '../../memory/_auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const { message, userId, sessionId, ttsEnabled } = await req.json();

    if (!message || !userId) {
        return new Response(
            `data: ${JSON.stringify({ type: 'error', message: 'message and userId are required' })}\n\n`,
            { status: 400, headers: { 'Content-Type': 'text/event-stream' } },
        );
    }

    const authHeader =
        req.headers.get('authorization') ||
        getBearerFromCookieHeader(req.headers.get('cookie')) ||
        (await getBearerFromSupabaseCookie());
    if (!authHeader?.startsWith('Bearer ')) {
        return new Response(
            `data: ${JSON.stringify({ type: 'error', message: 'Authorization Bearer token required' })}\n\n`,
            { status: 401, headers: { 'Content-Type': 'text/event-stream' } },
        );
    }

    // Ensure we have a session for thread continuity
    let resolvedSessionId: string | undefined = sessionId;

    try {
        // Agent API base URL (no trailing /api/v1).
        // - AGENTS_API_URL is expected to be a bare base (e.g. http://localhost:8765)
        // - MEMORY_API_URL may already include /api/v1, so we strip it.
        const normalizedMemoryUrl = process.env.MEMORY_API_URL
            ? process.env.MEMORY_API_URL.replace(/\/api\/v1\/?$/, '')
            : undefined;
        const baseUrl =
            (process.env.AGENTS_API_URL && process.env.AGENTS_API_URL.replace(/\/+$/, '')) ||
            (normalizedMemoryUrl && normalizedMemoryUrl.replace(/\/+$/, '')) ||
            'http://127.0.0.1:8765';
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
        const errEvent = `data: ${JSON.stringify({ type: 'error', message: (err instanceof Error ? err.message : String(err)) })}\n\n`;
        return new Response(errEvent, {
            status: 502,
            headers: { 'Content-Type': 'text/event-stream' },
        });
    }
}
