'use client';

import { useState, useRef, useCallback } from 'react';
import type {
    PronunciationAssessmentResult,
    PronunciationAssessmentStatus,
    WordResult,
} from '../types';

// ─── Azure Speech Token Cache ─────────────────────────────────────────────────

let cachedToken: { token: string; region: string; expiresAt: number } | null = null;

async function getSpeechToken(): Promise<{ token: string; region: string }> {
    const now = Date.now();
    if (cachedToken && cachedToken.expiresAt > now) {
        return { token: cachedToken.token, region: cachedToken.region };
    }

    const response = await fetch('/api/speech-token');
    if (!response.ok) {
        throw new Error('Failed to fetch speech token');
    }

    const data = await response.json();
    cachedToken = {
        token: data.token,
        region: data.region,
        expiresAt: now + 9 * 60 * 1000, // 9 minutes
    };

    return { token: data.token, region: data.region };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export interface UsePronunciationAssessmentReturn {
    status: PronunciationAssessmentStatus;
    result: PronunciationAssessmentResult | null;
    error: string | null;
    startAssessment: (referenceText: string) => Promise<void>;
    stopAssessment: () => void;
    reset: () => void;
    isRecording: boolean;
}

export function usePronunciationAssessment(): UsePronunciationAssessmentReturn {
    const [status, setStatus] = useState<PronunciationAssessmentStatus>('idle');
    const [result, setResult] = useState<PronunciationAssessmentResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const recognizerRef = useRef<any>(null);
    const startTimeRef = useRef<number>(0);

    const reset = useCallback(() => {
        setStatus('idle');
        setResult(null);
        setError(null);
    }, []);

    const stopAssessment = useCallback(() => {
        if (recognizerRef.current) {
            try {
                recognizerRef.current.stopContinuousRecognitionAsync();
            } catch {
                // ignore
            }
            recognizerRef.current = null;
        }
        setStatus('idle');
    }, []);

    const startAssessment = useCallback(async (referenceText: string) => {
        if (status === 'recording') return;

        setStatus('recording');
        setResult(null);
        setError(null);
        startTimeRef.current = Date.now();

        try {
            // Dynamically import the SDK to avoid SSR issues
            const SpeechSDK = await import('microsoft-cognitiveservices-speech-sdk');

            const { token, region } = await getSpeechToken();

            // Create speech config from authorization token
            const speechConfig = SpeechSDK.SpeechConfig.fromAuthorizationToken(token, region);
            speechConfig.speechRecognitionLanguage = 'ja-JP';

            // Configure pronunciation assessment
            const pronunciationConfig = new SpeechSDK.PronunciationAssessmentConfig(
                referenceText,
                SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
                SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
                true // enable miscue
            );
            pronunciationConfig.enableProsodyAssessment = true;

            // Use default microphone
            const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

            // Create recognizer
            const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
            pronunciationConfig.applyTo(recognizer);
            recognizerRef.current = recognizer;

            // Handle recognition result
            recognizer.recognized = (_sender: any, event: any) => {
                if (event.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
                    const pronunciationResult = SpeechSDK.PronunciationAssessmentResult.fromResult(event.result);
                    const durationMs = Date.now() - startTimeRef.current;

                    // Parse word-level results
                    const words: WordResult[] = [];
                    try {
                        const jsonResult = JSON.parse(event.result.properties.getProperty(
                            SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult
                        ));

                        const nbest = jsonResult?.NBest?.[0];
                        if (nbest?.Words) {
                            for (const w of nbest.Words) {
                                words.push({
                                    word: w.Word || '',
                                    accuracyScore: w.PronunciationAssessment?.AccuracyScore ?? 0,
                                    errorType: w.PronunciationAssessment?.ErrorType ?? 'None',
                                    phonemes: w.Phonemes?.map((p: any) => ({
                                        phoneme: p.Phoneme || '',
                                        accuracyScore: p.PronunciationAssessment?.AccuracyScore ?? 0,
                                    })) ?? [],
                                });
                            }
                        }
                    } catch {
                        // Fallback: use recognized text words without detailed scores
                        const recognizedWords = event.result.text?.split(' ') ?? [];
                        for (const w of recognizedWords) {
                            words.push({
                                word: w,
                                accuracyScore: pronunciationResult.accuracyScore,
                                errorType: 'None',
                            });
                        }
                    }

                    const assessmentResult: PronunciationAssessmentResult = {
                        recognizedText: event.result.text || '',
                        accuracyScore: Math.round(pronunciationResult.accuracyScore),
                        fluencyScore: Math.round(pronunciationResult.fluencyScore),
                        completenessScore: Math.round(pronunciationResult.completenessScore),
                        pronunciationScore: Math.round(pronunciationResult.pronunciationScore),
                        prosodyScore: pronunciationResult.prosodyScore
                            ? Math.round(pronunciationResult.prosodyScore)
                            : undefined,
                        words,
                        durationMs,
                    };

                    setResult(assessmentResult);
                    setStatus('done');

                    // Stop after getting result
                    recognizer.stopContinuousRecognitionAsync();
                    recognizerRef.current = null;
                } else if (event.result.reason === SpeechSDK.ResultReason.NoMatch) {
                    setError('No speech detected. Please try again.');
                    setStatus('error');
                    recognizer.stopContinuousRecognitionAsync();
                    recognizerRef.current = null;
                }
            };

            recognizer.canceled = (_sender: any, event: any) => {
                if (event.reason === SpeechSDK.CancellationReason.Error) {
                    setError(`Speech recognition error: ${event.errorDetails}`);
                    setStatus('error');
                } else {
                    setStatus('idle');
                }
                recognizerRef.current = null;
            };

            // Start recognition
            recognizer.startContinuousRecognitionAsync(
                () => {
                    // Successfully started
                },
                (err: any) => {
                    setError(`Failed to start recognition: ${err}`);
                    setStatus('error');
                    recognizerRef.current = null;
                }
            );

        } catch (err: any) {
            const message = err?.message || 'Failed to start speech recognition';
            setError(message);
            setStatus('error');
            recognizerRef.current = null;
        }
    }, [status]);

    return {
        status,
        result,
        error,
        startAssessment,
        stopAssessment,
        reset,
        isRecording: status === 'recording',
    };
}
