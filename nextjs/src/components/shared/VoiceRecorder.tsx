'use client';

/**
 * VoiceRecorder
 *
 * A self-contained microphone button that:
 *  1. Requests microphone permission on first use.
 *  2. Records audio via the MediaRecorder API.
 *  3. Sends the recorded blob to /api/chat/transcribe (OpenAI Whisper).
 *  4. Calls `onTranscript(text)` with the result so the parent can
 *     populate the chat input or send directly.
 *
 * States:
 *   idle       → show mic icon, click to start recording
 *   recording  → show animated stop icon, click to stop
 *   processing → show spinner while Whisper transcribes
 *   error      → brief error flash, then back to idle
 */

import { useState, useRef, useCallback } from 'react';
import { Mic, Square, Loader2, MicOff } from 'lucide-react';
import { clsx } from 'clsx';

type RecorderState = 'idle' | 'recording' | 'processing' | 'error';

interface VoiceRecorderProps {
    /** Called with the transcribed text when transcription succeeds. */
    onTranscript: (text: string) => void;
    /** Disable the button (e.g. while the AI is streaming). */
    disabled?: boolean;
    /** Extra class names for the outer button. */
    className?: string;
}

export function VoiceRecorder({ onTranscript, disabled = false, className }: VoiceRecorderProps) {
    const [state, setState] = useState<RecorderState>('idle');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);

    // ── Start recording ──────────────────────────────────────────────────────

    const startRecording = useCallback(async () => {
        setErrorMsg(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // Prefer webm/opus; fall back to whatever the browser supports
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : '';

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
            mediaRecorderRef.current = recorder;
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            recorder.onstop = async () => {
                // Stop all tracks to release the mic indicator
                streamRef.current?.getTracks().forEach(t => t.stop());
                streamRef.current = null;

                const blob = new Blob(chunksRef.current, {
                    type: mimeType || 'audio/webm',
                });
                await transcribe(blob, mimeType || 'audio/webm');
            };

            recorder.start();
            setState('recording');
        } catch (err: any) {
            console.error('[VoiceRecorder] getUserMedia error:', err);
            setErrorMsg('Microphone access denied');
            setState('error');
            setTimeout(() => setState('idle'), 2500);
        }
    }, []);

    // ── Stop recording ───────────────────────────────────────────────────────

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
            setState('processing');
        }
    }, []);

    // ── Transcribe via Whisper ───────────────────────────────────────────────

    const transcribe = useCallback(async (blob: Blob, mimeType: string) => {
        try {
            const ext = mimeType.includes('mp4') ? 'mp4'
                : mimeType.includes('ogg') ? 'ogg'
                    : 'webm';

            const formData = new FormData();
            formData.append('audio', blob, `recording.${ext}`);

            const res = await fetch('/api/chat/transcribe', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error ?? 'Transcription failed');
            }

            if (data.transcript) {
                onTranscript(data.transcript);
            }
            setState('idle');
        } catch (err: any) {
            console.error('[VoiceRecorder] transcription error:', err);
            setErrorMsg(err.message ?? 'Transcription failed');
            setState('error');
            setTimeout(() => setState('idle'), 2500);
        }
    }, [onTranscript]);

    // ── Click handler ────────────────────────────────────────────────────────

    const handleClick = () => {
        if (disabled || state === 'processing') return;
        if (state === 'recording') {
            stopRecording();
        } else if (state === 'idle') {
            startRecording();
        }
    };

    // ── Render ───────────────────────────────────────────────────────────────

    const isRecording = state === 'recording';
    const isProcessing = state === 'processing';
    const isError = state === 'error';

    return (
        <div className="relative flex items-center justify-center">
            <button
                type="button"
                onClick={handleClick}
                disabled={disabled || isProcessing}
                title={
                    isRecording ? 'Stop recording'
                        : isProcessing ? 'Transcribing…'
                            : isError ? (errorMsg ?? 'Error')
                                : 'Record voice message'
                }
                className={clsx(
                    'relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                    isRecording
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 scale-110'
                        : isProcessing
                            ? 'bg-[#F7FAFC] text-[#A0AEC0] cursor-wait'
                            : isError
                                ? 'bg-red-50 text-red-400'
                                : 'bg-[#F7FAFC] text-[#A0AEC0] hover:bg-[#EDF2F7] hover:text-[#3E4A61] hover:scale-105 active:scale-95',
                    disabled && !isRecording && 'opacity-40 cursor-not-allowed',
                    className,
                )}
                aria-label={isRecording ? 'Stop recording' : 'Start voice recording'}
            >
                {/* Pulsing ring while recording */}
                {isRecording && (
                    <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30 pointer-events-none" />
                )}

                {isProcessing ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : isRecording ? (
                    <Square size={14} fill="currentColor" />
                ) : isError ? (
                    <MicOff size={16} />
                ) : (
                    <Mic size={16} />
                )}
            </button>

            {/* Error tooltip */}
            {isError && errorMsg && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-md pointer-events-none">
                    {errorMsg}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-500" />
                </div>
            )}
        </div>
    );
}
