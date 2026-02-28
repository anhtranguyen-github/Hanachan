// ==========================================
// HOOK: useVideoProgress
// Tracks and persists video watch progress
// ==========================================

import { useState, useEffect, useCallback, useRef } from 'react';
import * as service from '../service';
import type { VideoProgress, UpdateProgressRequest } from '../types';

const SAVE_INTERVAL_MS = 5000; // Save progress every 5 seconds
const MIN_PROGRESS_TO_SAVE = 1; // Minimum 1% progress to save

export function useVideoProgress(userId: string | undefined, videoId: string | undefined) {
  const [progress, setProgress] = useState<VideoProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<UpdateProgressRequest | null>(null);

  // Load initial progress
  useEffect(() => {
    if (!userId || !videoId) {
      setLoading(false);
      return;
    }

    service.getVideoProgress(userId, videoId)
      .then(p => {
        setProgress(p);
        setLoading(false);
      })
      .catch(err => {
        console.error('[useVideoProgress] Load error:', err);
        setLoading(false);
      });
  }, [userId, videoId]);

  // Debounced save function
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = setTimeout(async () => {
      if (!userId || !videoId || !pendingUpdateRef.current) return;

      try {
        const updated = await service.updateVideoProgress(userId, pendingUpdateRef.current);
        setProgress(updated);
        pendingUpdateRef.current = null;
      } catch (err) {
        console.error('[useVideoProgress] Save error:', err);
      }
    }, SAVE_INTERVAL_MS);
  }, [userId, videoId]);

  // Update progress (called frequently during playback)
  const updateProgress = useCallback((
    currentTimeMs: number,
    durationMs: number
  ) => {
    if (!userId || !videoId || durationMs <= 0) return;

    const progressPercent = Math.round((currentTimeMs / durationMs) * 100);
    if (progressPercent < MIN_PROGRESS_TO_SAVE) return;

    const req: UpdateProgressRequest = {
      video_id: videoId,
      last_position_ms: currentTimeMs,
      progress_percent: Math.min(progressPercent, 100),
      completed: progressPercent >= 95,
    };

    // Update local state immediately for UI
    setProgress(prev => prev ? {
      ...prev,
      last_position_ms: currentTimeMs,
      progress_percent: req.progress_percent,
      completed: req.completed || false,
    } : null);

    // Queue for debounced save
    pendingUpdateRef.current = req;
    scheduleSave();
  }, [userId, videoId, scheduleSave]);

  // Force save immediately (e.g., on unmount or pause)
  const saveNow = useCallback(async () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    if (!userId || !videoId || !pendingUpdateRef.current) return;

    try {
      const updated = await service.updateVideoProgress(userId, pendingUpdateRef.current);
      setProgress(updated);
      pendingUpdateRef.current = null;
    } catch (err) {
      console.error('[useVideoProgress] Force save error:', err);
    }
  }, [userId, videoId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      // Save any pending progress
      if (pendingUpdateRef.current && userId && videoId) {
        service.updateVideoProgress(userId, pendingUpdateRef.current).catch(console.error);
      }
    };
  }, [userId, videoId]);

  return {
    progress,
    loading,
    updateProgress,
    saveNow,
    resumePosition: progress?.last_position_ms || 0,
    progressPercent: progress?.progress_percent || 0,
    isCompleted: progress?.completed || false,
  };
}
