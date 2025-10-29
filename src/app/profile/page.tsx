'use client';

import React from 'react';
import { ProfileClientView } from '@/modules/auth/components/ProfileClientView';
import { useAuth } from '@/modules/auth/AuthContext';
import { MOCK_GLOBAL_STATS } from '@/lib/mock-data';

export default function ProfilePage() {
    const { user, profile } = useAuth();

    const userData = {
        name: profile?.full_name || user?.email?.split('@')[0],
        email: user?.email,
        current_level_id: profile?.current_level_id
    };

    return (
        <ProfileClientView
            user={userData}
            srsSpread={MOCK_GLOBAL_STATS.srsDistribution}
            globalStats={MOCK_GLOBAL_STATS}
        />
    );
}
