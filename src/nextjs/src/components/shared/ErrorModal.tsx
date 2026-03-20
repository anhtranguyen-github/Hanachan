'use client';

import React from 'react';
import { BaseModal } from './BaseModal';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  error?: Error | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorModal({
  isOpen,
  onClose,
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  onDismiss,
}: ErrorModalProps) {
  const errorMessage = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : error;
  const fullMessage = errorMessage ? `${message}\n\n${errorMessage}` : message;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
      className="overflow-visible"
    >
      <div className="flex flex-col items-center text-center py-4">
        {/* Error Icon */}
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-red-100 rounded-full blur-xl opacity-60" />
          <div className="relative w-16 h-16 bg-gradient-to-br from-red-400 to-red-500 rounded-full flex items-center justify-center shadow-lg shadow-red-200">
            <AlertTriangle size={28} className="text-white" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-black text-[#3E4A61] mb-2">{title}</h3>

        {/* Message */}
        <p className="text-sm text-[#A0AEC0] leading-relaxed max-w-[280px] whitespace-pre-line">
          {fullMessage}
        </p>

        {/* Actions */}
        <div className="flex gap-3 mt-6 w-full">
          {onDismiss && (
            <button
              onClick={() => {
                onDismiss();
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl border border-border/30 text-[11px] font-black text-[#A0AEC0] hover:text-[#3E4A61] hover:bg-[#F7FAFC] uppercase tracking-wide transition-all flex items-center justify-center gap-2"
            >
              <X size={14} />
              Dismiss
            </button>
          )}
          {onRetry ? (
            <button
              onClick={() => {
                onRetry();
                onClose();
              }}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[11px] font-black uppercase tracking-wide hover:bg-red-600 transition-all flex items-center justify-center gap-2 shadow-md shadow-red-200"
            >
              <RefreshCw size={14} />
              Try Again
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-[#3E4A61] text-white text-[11px] font-black uppercase tracking-wide hover:bg-[#2d3649] transition-all"
            >
              Got It
            </button>
          )}
        </div>
      </div>
    </BaseModal>
  );
}

// Hook for managing error modal state
import { useState, useCallback } from 'react';

interface ErrorState {
  isOpen: boolean;
  title: string;
  message: string;
  error: Error | string | null;
  onRetry?: () => void;
}

export function useErrorModal() {
  const [errorState, setErrorState] = useState<ErrorState>({
    isOpen: false,
    title: 'Something went wrong',
    message: '',
    error: null,
  });

  const showError = useCallback(({
    title = 'Something went wrong',
    message,
    error,
    onRetry,
  }: {
    title?: string;
    message: string;
    error?: Error | string | null;
    onRetry?: () => void;
  }) => {
    setErrorState({
      isOpen: true,
      title,
      message,
      error: error || null,
      onRetry,
    });
  }, []);

  const hideError = useCallback(() => {
    setErrorState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const ErrorModalComponent = useCallback(
    () => (
      <ErrorModal
        isOpen={errorState.isOpen}
        onClose={hideError}
        title={errorState.title}
        message={errorState.message}
        error={errorState.error}
        onRetry={errorState.onRetry}
      />
    ),
    [errorState, hideError]
  );

  return {
    showError,
    hideError,
    ErrorModal: ErrorModalComponent,
    isOpen: errorState.isOpen,
  };
}
