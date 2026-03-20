'use client';

import React from 'react';
import { useAuth } from './AuthContext';
import { clsx } from 'clsx';

interface AuthGuardProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    message?: string;
    showModal?: boolean;
}

export function AuthGuard({ 
    children, 
    fallback,
    message = 'This feature requires authentication',
    showModal = true 
}: AuthGuardProps) {
    const { user, loading, openLoginModal } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#F4ACB7] border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500">Loading...</span>
                </div>
            </div>
        );
    }

    if (!user) {
        if (fallback) {
            return <>{fallback}</>;
        }

        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-[#F4ACB7]/10 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-[#F4ACB7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">Authentication Required</h3>
                <p className="text-gray-500 mb-4 max-w-sm">{message}</p>
                {showModal && (
                    <button
                        onClick={() => openLoginModal()}
                        className="px-6 py-2.5 bg-gradient-to-r from-[#F4ACB7] to-[#CDB4DB] hover:from-[#F4ACB7]/90 hover:to-[#CDB4DB]/90 text-white font-bold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Sign In to Continue
                    </button>
                )}
            </div>
        );
    }

    return <>{children}</>;
}

// Hook for checking auth status programmatically
export function useAuthCheck() {
    const { user, loading, openLoginModal } = useAuth();
    
    const checkAuth = (callback: () => void) => {
        if (loading) return;
        if (!user) {
            openLoginModal();
            return;
        }
        callback();
    };

    return { user, loading, checkAuth };
}

// Component for gating interactive elements
interface GateProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    message?: string;
    tooltip?: string;
}

export function Gate({ 
    children, 
    requireAuth = true, 
    message = 'Sign in to use this feature',
    tooltip 
}: GateProps) {
    const { user, loading, openLoginModal } = useAuth();

    if (!requireAuth || loading) {
        return <>{children}</>;
    }

    const handleClick = (e: React.MouseEvent) => {
        if (!user) {
            e.preventDefault();
            e.stopPropagation();
            openLoginModal();
        }
    };

    return (
        <div 
            className={clsx("relative", !user && "cursor-not-allowed")}
            onClick={!user ? handleClick : undefined}
        >
            {!user && tooltip && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50">
                    {tooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </div>
            )}
            {!user ? (
                <div onClick={handleClick}>
                    {children}
                </div>
            ) : (
                children
            )}
        </div>
    );
}
