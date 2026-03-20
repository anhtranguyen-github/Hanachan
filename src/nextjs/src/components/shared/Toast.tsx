'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  hideToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Toast>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast, updateToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts, hideToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef<number | null>(null);
  const duration = toast.duration ?? 5000;
  const persistent = toast.persistent ?? false;

  useEffect(() => {
    if (persistent || toast.type === 'loading') return;

    startTimeRef.current = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current || 0);
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        onClose();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, persistent, toast.type, onClose]);

  const icons = {
    success: <CheckCircle size={18} className="text-emerald-500" />,
    error: <AlertCircle size={18} className="text-red-500" />,
    info: <Info size={18} className="text-blue-500" />,
    loading: <Loader2 size={18} className="text-primary animate-spin" />,
  };

  const borderColors = {
    success: 'border-emerald-200',
    error: 'border-red-200',
    info: 'border-blue-200',
    loading: 'border-primary/30',
  };

  return (
    <div
      className={clsx(
        'pointer-events-auto',
        'w-[320px] bg-white rounded-2xl shadow-xl border overflow-hidden',
        'animate-in slide-in-from-right-4 fade-in duration-300',
        borderColors[toast.type]
      )}
    >
      <div className="p-4 flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-[#3E4A61]">{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-[#A0AEC0] mt-0.5 leading-relaxed">{toast.message}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-[#CBD5E0] hover:text-[#3E4A61] hover:bg-[#F7FAFC] transition-all"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      {!persistent && toast.type !== 'loading' && (
        <div className="h-1 bg-[#F7FAFC] overflow-hidden">
          <div
            className={clsx(
              'h-full transition-all duration-100 ease-linear',
              toast.type === 'success' && 'bg-emerald-400',
              toast.type === 'error' && 'bg-red-400',
              toast.type === 'info' && 'bg-blue-400'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Loading bar animation */}
      {toast.type === 'loading' && (
        <div className="h-1 bg-[#F7FAFC] overflow-hidden">
          <div className="h-full bg-primary/60 animate-[loading-bar_1.5s_ease-in-out_infinite] w-1/3" />
        </div>
      )}
    </div>
  );
}

// Helper hook for common toast patterns
export function useToastHelpers() {
  const { showToast, hideToast, updateToast } = useToast();

  const showSuccess = useCallback(
    (title: string, message?: string, duration?: number) => {
      return showToast({ type: 'success', title, message, duration });
    },
    [showToast]
  );

  const showError = useCallback(
    (title: string, message?: string, duration?: number) => {
      return showToast({ type: 'error', title, message, duration: duration ?? 6000 });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string, duration?: number) => {
      return showToast({ type: 'info', title, message, duration });
    },
    [showToast]
  );

  const showLoading = useCallback(
    (title: string, message?: string) => {
      return showToast({ type: 'loading', title, message, persistent: true });
    },
    [showToast]
  );

  const updateLoading = useCallback(
    (id: string, type: 'success' | 'error', title: string, message?: string) => {
      updateToast(id, { type, title, message, persistent: false, duration: 5000 });
    },
    [updateToast]
  );

  const dismissToast = useCallback(
    (id: string) => {
      hideToast(id);
    },
    [hideToast]
  );

  return {
    showSuccess,
    showError,
    showInfo,
    showLoading,
    updateLoading,
    dismissToast,
  };
}
