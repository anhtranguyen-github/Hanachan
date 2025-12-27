
'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { createClient } from '@/services/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isAuthResolved: boolean;
    isAuthenticated: boolean;
    signIn: (email: string, password: string) => Promise<any>;
    signInWithGoogle: () => Promise<any>;
    signOut: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isAuthResolved, setIsAuthResolved] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        let mounted = true;

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (mounted) {
                setSession(session);
                setUser(session?.user ?? null);
                setIsAuthResolved(true);
                console.log('DEBUG: Auth State Resolved. User:', session?.user?.email);
            }
        });

        // Initial check
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (mounted && !isAuthResolved) {
                setSession(session);
                setUser(session?.user ?? null);
                setIsAuthResolved(true);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

    const value = useMemo(() => ({
        user,
        session,
        isAuthResolved,
        isAuthenticated: !!user,
        signIn: async (email, password) => {
            return await supabase.auth.signInWithPassword({ email, password });
        },
        signInWithGoogle: async () => {
            return await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/auth/callback' } });
        },
        signOut: async () => {
            await supabase.auth.signOut();
        },
        logout: async () => {
            await supabase.auth.signOut();
        }
    }), [user, session, isAuthResolved, supabase]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
}

export const useUser = useAuth;
