/**
 * /api/chat/transcribe — Voice-to-text transcription endpoint.
 *
 * Accepts a multipart/form-data POST with an `audio` file field.
 * Uses OpenAI Whisper (whisper-1) to transcribe the audio and returns
 * the transcript as JSON.
 *
 * Response:
 *   { success: true,  transcript: string }
 *   { success: false, error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Lazy-load OpenAI to avoid build-time errors when the API key is missing
let _openai: OpenAI | null = null;
function getOpenAI() {
    if (!_openai) {
        _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'placeholder_for_build' });
    }
    return _openai;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const audioFile = formData.get('audio');

        if (!audioFile || !(audioFile instanceof Blob)) {
            return NextResponse.json(
                { success: false, error: 'audio field is required' },
                { status: 400 },
            );
        }

        // Convert Blob → File so the OpenAI SDK can read the filename/type
        const file = new File(
            [audioFile],
            (audioFile as File).name ?? 'recording.webm',
            { type: audioFile.type || 'audio/webm' },
        );

        const openai = getOpenAI();
        const transcription = await openai.audio.transcriptions.create({
            file,
            model: 'whisper-1',
            response_format: 'text',
        });

        // whisper-1 with response_format:'text' returns a plain string
        const transcript = typeof transcription === 'string'
            ? transcription
            : (transcription as any).text ?? '';

        return NextResponse.json({ success: true, transcript: transcript.trim() });
    } catch (err: any) {
        console.error('[Transcribe API]', err);
        return NextResponse.json(
            { success: false, error: err.message ?? 'Transcription failed' },
            { status: 500 },
        );
    }
}
