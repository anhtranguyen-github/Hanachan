
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

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

// Mock user for local development
const MOCK_USER: User = {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'learner@hanachan.app',
    user_metadata: {
        display_name: 'Hana Learner',
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hana'
    }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading state
        const timer = setTimeout(() => {
            setUser(MOCK_USER);
            setLoading(false);
        }, 500);

        return () => clearTimeout(timer);
    }, []);

    const value = {
        user,
        loading,
        signOut: async () => {
            setUser(null);
            console.log("Mock signed out");
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
