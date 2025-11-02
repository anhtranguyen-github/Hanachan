
'use client';

import React from 'react';
import { useUser } from '@/features/auth/AuthContext';

import { type Role } from '@/features/auth/types';

interface RoleGateProps {
    children: React.ReactNode;
    allowedRoles?: Role[];
    fallback?: React.ReactNode;
}

/**
 * A component to conditionally render children based on the user's role.
 * If no allowedRoles are provided, it simply checks if the user is logged in.
 */
export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
    const { user, loading } = useUser();

    if (loading) return null;

    if (!user) {
        return <>{fallback}</>;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
