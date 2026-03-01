'use client';

import React from 'react';
import { clsx } from 'clsx';
import { Loader2, Film, CheckCircle, AlertCircle, X } from 'lucide-react';

export type UploadStage = 'validating' | 'fetching' | 'processing' | 'adding' | 'complete' | 'error';

interface VideoUploadProgressProps {
  isOpen: boolean;
  stage: UploadStage;
  progress?: number;
  videoTitle?: string;
  error?: string | null;
  onClose?: () => void;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const stages: { key: UploadStage; label: string; description: string }[] = [
  {
    key: 'validating',
    label: 'Validating URL',
    description: 'Checking YouTube video...',
  },
  {
    key: 'fetching',
    label: 'Fetching Video',
    description: 'Retrieving video information...',
  },
  {
    key: 'processing',
    label: 'Processing',
    description: 'Analyzing content and subtitles...',
  },
  {
    key: 'adding',
    label: 'Adding to Library',
    description: 'Saving to your collection...',
  },
];

export function VideoUploadProgress({
  isOpen,
  stage,
  progress,
  videoTitle,
  error,
  onClose,
  onRetry,
  onDismiss,
}: VideoUploadProgressProps) {
  if (!isOpen) return null;

  const isComplete = stage === 'complete';
  const isError = stage === 'error';
  const currentStageIndex = stages.findIndex(s => s.key === stage);

  // Calculate progress percentage
  const calculatedProgress = progress ?? (currentStageIndex >= 0 
    ? ((currentStageIndex + 1) / stages.length) * 100 
    : 0
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#3E4A61]/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={isComplete || isError ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with gradient */}
        <div className={clsx(
          "px-6 py-5",
          isComplete ? "bg-gradient-to-r from-emerald-400 to-emerald-500" :
          isError ? "bg-gradient-to-r from-red-400 to-red-500" :
          "bg-gradient-to-r from-primary to-primary-dark"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              {isComplete ? (
                <CheckCircle size={20} className="text-white" />
              ) : isError ? (
                <AlertCircle size={20} className="text-white" />
              ) : (
                <Film size={20} className="text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-black text-lg">
                {isComplete ? 'Video Added!' : isError ? 'Upload Failed' : 'Adding Video'}
              </h3>
              {videoTitle && !isError && (
                <p className="text-white/80 text-xs truncate font-medium">{videoTitle}</p>
              )}
            </div>
            {(isComplete || isError) && onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!isComplete && !isError && (
            <>
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#3E4A61]">
                    {stages[currentStageIndex]?.label || 'Processing...'}
                  </span>
                  <span className="font-black text-primary">{Math.round(calculatedProgress)}%</span>
                </div>
                <div className="h-2.5 bg-[#F7FAFC] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${calculatedProgress}%` }}
                  >
                    <div className="h-full w-full bg-white/30 animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
                <p className="text-xs text-[#A0AEC0]">
                  {stages[currentStageIndex]?.description}
                </p>
              </div>

              {/* Stage indicators */}
              <div className="flex justify-between">
                {stages.map((s, i) => {
                  const isActive = i === currentStageIndex;
                  const isPast = i < currentStageIndex;
                  
                  return (
                    <div key={s.key} className="flex flex-col items-center gap-1.5">
                      <div className={clsx(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                        isPast ? 'bg-emerald-100 text-emerald-500' :
                        isActive ? 'bg-primary text-white shadow-md shadow-primary/30' :
                        'bg-[#F7FAFC] text-[#CBD5E0]'
                      )}>
                        {isPast ? (
                          <CheckCircle size={14} />
                        ) : isActive ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <div className="w-2 h-2 rounded-full bg-current" />
                        )}
                      </div>
                      <span className={clsx(
                        'text-[8px] font-black uppercase tracking-wide transition-colors',
                        isPast || isActive ? 'text-[#3E4A61]' : 'text-[#CBD5E0]'
                      )}>
                        {s.label.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Success State */}
          {isComplete && (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#3E4A61]">
                  Video successfully added to your library!
                </p>
                <p className="text-xs text-[#A0AEC0] mt-1">
                  You can now start learning with this video.
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-emerald-500 text-white text-sm font-black uppercase tracking-wide hover:bg-emerald-600 transition-all shadow-md shadow-emerald-200"
              >
                Start Learning
              </button>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#3E4A61]">
                  Couldn't add video
                </p>
                <p className="text-xs text-red-500 mt-1">
                  {error || 'Something went wrong. Please try again.'}
                </p>
              </div>
              <div className="flex gap-3">
                {onDismiss && (
                  <button
                    onClick={() => {
                      onDismiss();
                      onClose?.();
                    }}
                    className="flex-1 py-2.5 rounded-xl border border-border/30 text-[11px] font-black text-[#A0AEC0] hover:text-[#3E4A61] hover:bg-[#F7FAFC] uppercase tracking-wide transition-all"
                  >
                    Cancel
                  </button>
                )}
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[11px] font-black uppercase tracking-wide hover:bg-red-600 transition-all shadow-md shadow-red-200"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook for managing upload progress state
import { useState, useCallback } from 'react';

interface UploadState {
  isOpen: boolean;
  stage: UploadStage;
  progress: number;
  videoTitle: string;
  error: string | null;
}

export function useVideoUploadProgress() {
  const [state, setState] = useState<UploadState>({
    isOpen: false,
    stage: 'validating',
    progress: 0,
    videoTitle: '',
    error: null,
  });

  const startUpload = useCallback((videoTitle: string = '') => {
    setState({
      isOpen: true,
      stage: 'validating',
      progress: 0,
      videoTitle,
      error: null,
    });
  }, []);

  const updateStage = useCallback((stage: UploadStage, progress?: number) => {
    setState(prev => ({
      ...prev,
      stage,
      progress: progress ?? prev.progress,
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      stage: 'error',
      error,
    }));
  }, []);

  const completeUpload = useCallback(() => {
    setState(prev => ({
      ...prev,
      stage: 'complete',
      progress: 100,
    }));
  }, []);

  const closeUpload = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const resetUpload = useCallback(() => {
    setState({
      isOpen: false,
      stage: 'validating',
      progress: 0,
      videoTitle: '',
      error: null,
    });
  }, []);

  return {
    ...state,
    startUpload,
    updateStage,
    setError,
    completeUpload,
    closeUpload,
    resetUpload,
  };
}
