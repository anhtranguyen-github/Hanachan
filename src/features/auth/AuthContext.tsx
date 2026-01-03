
'use client';
import React, { createContext, useContext } from 'react';

const AuthContext = createContext<any>({ user: { id: 'mock', email: 'mock@user.com' }, loading: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
    return <AuthContext.Provider value={{ user: { id: 'mock', email: 'mock@user.com' }, loading: false }}>{children}</AuthContext.Provider>;
}

export function useUser() {
    return useContext(AuthContext);
}
