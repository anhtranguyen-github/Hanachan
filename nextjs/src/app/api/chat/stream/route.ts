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
import { memoryChatStream, createMemorySession } from '@/lib/memory-client';

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

    // Ensure we have a session for thread continuity
    let resolvedSessionId: string | undefined = sessionId;
    if (!resolvedSessionId) {
        try {
            resolvedSessionId = await createMemorySession(userId, { source: 'hanachan' });
        } catch {
            // Non-fatal — chat will still work without session context
        }
    }

    try {
        const upstream = await memoryChatStream(userId, message, resolvedSessionId, ttsEnabled);

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

        return new Response(upstream.pipeThrough(transform), {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive',
                'X-Memory-Session-Id': resolvedSessionId ?? '',
            },
        });
    } catch (err: any) {
        const errEvent = `data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`;
        return new Response(errEvent, {
            status: 500,
            headers: { 'Content-Type': 'text/event-stream' },
        });
    }
}
