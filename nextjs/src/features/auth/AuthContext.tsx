'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { syncUserAction } from './actions';

interface User {
    id: string;
    email: string;
    user_metadata: {
        display_name: string;
        avatar_url?: string;
    };
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
});


export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const syncProfile = async (u: User | null) => {
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
            const u = session?.user as unknown as User || null;
            setUser(u);
            syncProfile(u);
            setLoading(false);
        }).catch(err => {
            console.error("Auth check failed:", err);
            setLoading(false);
        });

        // 2. Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const u = session?.user as unknown as User || null;
            setUser(u);
            syncProfile(u);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const value = {
        user,
        loading,
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

export const useUser = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useUser must be used within an AuthProvider');
    }
    return context;
};
