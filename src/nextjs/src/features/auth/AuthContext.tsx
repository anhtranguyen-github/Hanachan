'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { syncUserAction } from './actions';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
    id: string;
    email: string;
    user_metadata: {
        display_name: string;
        avatar_url?: string;
    };
}

export interface AuthModalState {
    isOpen: boolean;
    mode: 'login' | 'register';
    onClose?: () => void;
}

interface AuthContextType {
    user: AuthUser | null;
    loading: boolean;
    authModal: AuthModalState;
    openLoginModal: (onClose?: () => void) => void;
    openRegisterModal: (onClose?: () => void) => void;
    closeAuthModal: () => void;
    signOut: () => Promise<void>;
}

const defaultAuthModal: AuthModalState = {
    isOpen: false,
    mode: 'login',
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    authModal: defaultAuthModal,
    openLoginModal: () => {},
    openRegisterModal: () => {},
    closeAuthModal: () => {},
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [authModal, setAuthModal] = useState<AuthModalState>(defaultAuthModal);

    const openLoginModal = useCallback((onClose?: () => void) => {
        setAuthModal({ isOpen: true, mode: 'login', onClose });
    }, []);

    const openRegisterModal = useCallback((onClose?: () => void) => {
        setAuthModal({ isOpen: true, mode: 'register', onClose });
    }, []);

    const closeAuthModal = useCallback(() => {
        setAuthModal(prev => {
            prev.onClose?.();
            return { ...defaultAuthModal };
        });
    }, []);

    useEffect(() => {
        const syncProfile = async (u: AuthUser | null) => {
            if (u) {
                await syncUserAction(
                    u.id,
                    u.email,
                    u.user_metadata.display_name,
                    u.user_metadata.avatar_url
                );
            }
        };

        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const u = session?.user as unknown as AuthUser || null;
            setUser(u);
            syncProfile(u);
            setLoading(false);
        }).catch(err => {
            console.error("Auth check failed:", err);
            setLoading(false);
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const u = session?.user as unknown as AuthUser || null;
            setUser(u);
            syncProfile(u);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const value = {
        user,
        loading,
        authModal,
        openLoginModal,
        openRegisterModal,
        closeAuthModal,
        signOut: async () => {
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
                setUser(null);
                return;
            }
            await supabase.auth.signOut();
        },
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Keep backward compatibility
export const useUser = () => {
    const { user, loading, signOut, authModal, openLoginModal, openRegisterModal, closeAuthModal } = useAuth();
    return { user, loading, signOut, authModal, openLoginModal, openRegisterModal, closeAuthModal };
};
