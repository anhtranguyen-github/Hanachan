'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import {
  Mic,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Loader2,
  Volume2,
  Settings,
  Target,
  Keyboard,
} from 'lucide-react';
import type {
  DictationSession,
  DictationSubtitle,
  DictationAttemptResult,
  DictationSettings,
} from '../types';
import * as videoService from '../service';

interface DictationPracticeProps {
  videoId: string;
  videoTitle: string;
  onComplete?: () => void;
  onClose?: () => void;
}

export function DictationPractice({
  videoId,
  videoTitle,
  onComplete,
  onClose,
}: DictationPracticeProps) {
  // Session state
  const [session, setSession] = useState<DictationSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<DictationAttemptResult | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<DictationSettings>({
    included_jlpt_levels: [5, 4, 3, 2, 1],
    min_subtitle_length: 1,
    max_subtitle_length: 100,
    enable_reading_hint: false,
    playback_speed: 1.0,
    auto_advance: true,
  });

  // Stats
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const startTimeRef = useRef<number>(0);

  // Start a new session
  const startSession = useCallback(async () => {
    setIsLoading(true);
    setLastResult(null);
    setUserInput('');
    setCorrectCount(0);
    setAttemptCount(0);
    setCurrentIndex(0);

    try {
      const result = await videoService.createDictationSession(videoId, settings);
      setSession(result);
    } catch (error) {
      console.error('Failed to start session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [videoId, settings]);

  useEffect(() => {
    startSession();
  }, [startSession]);

  // Focus input when current subtitle changes
  useEffect(() => {
    if (session && currentIndex < session.subtitles.length) {
      inputRef.current?.focus();
      startTimeRef.current = Date.now();
    }
  }, [session, currentIndex]);

  // Submit attempt
  const handleSubmit = useCallback(async () => {
    if (!session || !userInput.trim()) return;

    const currentSubtitle = session.subtitles[currentIndex];
    if (!currentSubtitle) return;

    setIsSubmitting(true);
    const timeTaken = Date.now() - startTimeRef.current;

    try {
      const result = await videoService.submitDictationAttempt(
        session.session_id!,
        currentSubtitle.id,
        userInput,
        timeTaken
      );

      if (result.result) {
        setLastResult(result.result);
        setAttemptCount((prev) => prev + 1);
        if (result.result.is_correct) {
          setCorrectCount((prev) => prev + 1);
        }

        // Auto-advance or wait for user
        if (result.result.is_correct && settings.auto_advance) {
          setTimeout(() => {
            if (currentIndex < session.subtitles.length - 1) {
              setCurrentIndex((prev) => prev + 1);
              setUserInput('');
              setLastResult(null);
            } else {
              // Session complete
              onComplete?.();
            }
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Failed to submit attempt:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [session, userInput, currentIndex, settings.auto_advance, onComplete]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Get current subtitle
  const currentSubtitle = session?.subtitles?.[currentIndex];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-[#718096]">Loading dictation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!session || !session.success) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <XCircle className="w-12 h-12 text-red-400" />
        <p className="text-sm text-[#718096] text-center">
          {session?.error || 'Failed to load subtitles for dictation'}
        </p>
        <button
          onClick={startSession}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty subtitles
  if (session.subtitles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-4">
        <div className="text-4xl">📝</div>
        <p className="text-sm text-[#718096] text-center">
          No subtitles available for dictation practice.
        </p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-[#F7FAFC] text-[#718096] rounded-xl text-sm font-bold"
        >
          Close
        </button>
      </div>
    );
  }

  // Calculate progress
  const progress = ((currentIndex + 1) / session.subtitles.length) * 100;
  const accuracy = attemptCount > 0 ? Math.round((correctCount / attemptCount) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Keyboard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#3E4A61]">Dictation Practice</h3>
            <p className="text-[10px] text-[#A0AEC0]">{videoTitle}</p>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-[#F7FAFC] rounded-xl transition-colors"
        >
          <Settings className="w-4 h-4 text-[#A0AEC0]" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-[#F7FAFC] border-b border-border/20 space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.enable_reading_hint}
              onChange={(e) =>
                setSettings((s) => ({ ...s, enable_reading_hint: e.target.checked }))
              }
              className="rounded"
            />
            <span className="text-xs font-medium text-[#718096]">Show reading hint</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.auto_advance}
              onChange={(e) =>
                setSettings((s) => ({ ...s, auto_advance: e.target.checked }))
              }
              className="rounded"
            />
            <span className="text-xs font-medium text-[#718096]">Auto-advance on correct</span>
          </label>
        </div>
      )}

      {/* Progress Bar */}
      <div className="px-4 py-3 border-b border-border/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-[#A0AEC0]">
            {currentIndex + 1} / {session.subtitles.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-[#48BB78]">
              {correctCount} ✓
            </span>
            <span className="text-[10px] font-bold text-[#A0AEC0]">
              {accuracy}% accuracy
            </span>
          </div>
        </div>
        <div className="h-1.5 bg-[#EDF2F7] rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 space-y-4 overflow-auto">
        {/* Reading hint if enabled */}
        {settings.enable_reading_hint && currentSubtitle?.reading && (
          <div className="text-center">
            <p className="text-sm font-medium text-[#A0AEC0] jp-text">
              {currentSubtitle.reading}
            </p>
          </div>
        )}

        {/* Input area */}
        <div className="space-y-2">
          <textarea
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type what you hear..."
            className={clsx(
              'w-full p-4 text-lg jp-text font-medium bg-white border-2 rounded-2xl resize-none focus:outline-none transition-colors',
              lastResult
                ? lastResult.is_correct
                  ? 'border-[#48BB78] bg-[#48BB78]/5'
                  : 'border-[#FC8181] bg-[#FC8181]/5'
                : 'border-[#EDF2F7] focus:border-primary'
            )}
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        {/* Result feedback */}
        {lastResult && (
          <div
            className={clsx(
              'p-4 rounded-2xl space-y-2',
              lastResult.is_correct ? 'bg-[#48BB78]/10' : 'bg-[#FC8181]/10'
            )}
          >
            <div className="flex items-center gap-2">
              {lastResult.is_correct ? (
                <CheckCircle2 className="w-5 h-5 text-[#48BB78]" />
              ) : (
                <XCircle className="w-5 h-5 text-[#FC8181]" />
              )}
              <span
                className={clsx(
                  'text-sm font-bold',
                  lastResult.is_correct ? 'text-[#48BB78]' : 'text-[#FC8181]'
                )}
              >
                {lastResult.is_correct ? 'Correct!' : 'Not quite right'}
              </span>
            </div>

            {!lastResult.is_correct && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-[#A0AEC0] uppercase">Correct:</p>
                <p className="text-base font-black text-[#3E4A61] jp-text">
                  {lastResult.target_text}
                </p>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-[#718096]">
              <span>Accuracy: {lastResult.accuracy_score}%</span>
              <span>
                {lastResult.correct_chars}/{lastResult.total_chars} characters
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border/20 flex items-center gap-3">
        <button
          onClick={() => {
            setUserInput('');
            setLastResult(null);
            inputRef.current?.focus();
          }}
          className="p-3 bg-[#F7FAFC] hover:bg-[#EDF2F7] rounded-xl transition-colors"
          disabled={isSubmitting}
        >
          <RotateCcw className="w-5 h-5 text-[#718096]" />
        </button>

        <button
          onClick={handleSubmit}
          disabled={!userInput.trim() || isSubmitting}
          className={clsx(
            'flex-1 py-3 rounded-2xl font-bold text-sm transition-all',
            userInput.trim()
              ? 'bg-primary text-white hover:shadow-lg hover:shadow-primary/25'
              : 'bg-[#EDF2F7] text-[#A0AEC0] cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking...
            </span>
          ) : (
            'Check (Enter)'
          )}
        </button>
      </div>
    </div>
  );
}

// Standalone Dictation Panel for video page
interface DictationPanelProps {
  videoId: string;
  videoTitle: string;
}

export function DictationPanel({ videoId, videoTitle }: DictationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
      >
        <Keyboard className="w-4 h-4" />
        Start Dictation Practice
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl h-[80vh] overflow-hidden shadow-2xl">
        <DictationPractice
          videoId={videoId}
          videoTitle={videoTitle}
          onComplete={() => setIsOpen(false)}
          onClose={() => setIsOpen(false)}
        />
      </div>
    </div>
  );
}
