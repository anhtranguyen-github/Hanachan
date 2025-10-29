'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/modules/auth/AuthContext';
import {
    Users,
    Layers,
    Settings,
    ShieldAlert,
    Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// We'll import these after creating them. For now, we can define stubs or use dynamic imports if needed.
// But to ensure a clean build, I will assume I create them immediately after.
import { UserManagement } from '@/modules/auth/components/admin/UserManagement';
import { DeckManagement } from '@/modules/auth/components/admin/DeckManagement';
import { SystemConfig } from '@/modules/auth/components/admin/SystemConfig';

export default function AdminPage() {
    const { user, loading } = useUser();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'users' | 'decks' | 'system'>('users');

    // Protect route
    React.useEffect(() => {
        if (!loading && (!user || user.role !== 'ADMIN')) {
            router.push('/');
        }
    }, [user, loading, router]);

    if (loading || !user || user.role !== 'ADMIN') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-sakura-bg">
                <Loader2 className="animate-spin text-sakura-accent-primary" size={48} />
            </div>
        );
    }

    const tabs = [
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'decks', label: 'Deck Management', icon: Layers },
        { id: 'system', label: 'System Config', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-sakura-bg p-6 lg:p-12">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-destructive">
                        <ShieldAlert size={32} />
                        <h1 className="text-4xl font-black text-sakura-text-primary">
                            Admin Portal
                        </h1>
                    </div>
                    <p className="text-sakura-text-muted font-medium">
                        Manage users, content, and system configurations.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 border-b border-sakura-divider pb-1">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-t-2xl font-bold transition-all",
                                    isActive
                                        ? "bg-white text-sakura-accent-primary  border-x border-t border-sakura-divider -mb-px relative z-10"
                                        : "bg-transparent text-sakura-text-muted hover:text-sakura-text-primary hover:bg-sakura-bg-soft"
                                )}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-b-3xl rounded-tr-3xl p-8 border border-sakura-divider  min-h-[500px]">
                    {activeTab === 'users' && <UserManagement />}
                    {activeTab === 'decks' && <DeckManagement />}
                    {activeTab === 'system' && <SystemConfig />}
                </div>
            </div>
        </div>
    );
}
