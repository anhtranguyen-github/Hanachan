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
import { llmClient } from '@/services/llmClient';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getErrorMessage(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    try {
        return JSON.stringify(error);
    } catch {
        return 'Transcription failed';
    }
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
        const fileName = audioFile instanceof File ? audioFile.name : 'recording.webm';
        const file = new File(
            [audioFile],
            fileName,
            { type: audioFile.type || 'audio/webm' },
        );

        const transcription = await llmClient.transcribeAudio(file);

        // whisper-1 with response_format:'text' returns a plain string
        const transcript = typeof transcription === 'string'
            ? transcription
            : (transcription as any).text ?? '';

        return NextResponse.json({ success: true, transcript: transcript.trim() });
    } catch (err: unknown) {
        console.error('[Transcribe API]', err);
        return NextResponse.json(
            { success: false, error: getErrorMessage(err) },
            { status: 500 },
        );
    }
}
