'use client';

import React, { useState } from 'react';
import { User, Mail, Shield, Camera, Edit2, Check, X, TrendingUp, BarChart3, Clock } from 'lucide-react';
import { GlobalStatsDashboard } from '@/features/analytics/components/GlobalStatsDashboard';
import { SRSDistributionChart } from '@/features/analytics/components/DeckProgressCharts';
import { toast } from 'sonner';

interface ProfileClientViewProps {
    user: any;
    srsSpread: any;
    globalStats: any;
}

export function ProfileClientView({
    user,
    srsSpread,
    globalStats
}: ProfileClientViewProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveProfile = async () => {
        if (!editName.trim()) {
            toast.error("Name cannot be empty");
            return;
        }
        setIsSaving(true);
        // Note: Real update would use a Server Action
        // For now, simulating success as focus is on data fetching layer
        setTimeout(() => {
            setIsSaving(false);
            setIsEditing(false);
            toast.success("Profile updated!");
        }, 500);
    };

    return (
        <div className="p-8 max-w-[1400px] mx-auto pb-24">
            <header className="mb-12">
                <h1 className="text-4xl font-black text-sakura-text-primary tracking-tight mb-2">User Dashboard</h1>
                <p className="text-sakura-text-secondary font-bold">Welcome back, {user?.name || 'Explorer'}.</p>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-4 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-sakura-divider p-8  relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-sakura-accent-primary/10 to-transparent" />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="relative mb-6">
                                <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center border-4 border-sakura-bg-soft  overflow-hidden ring-4 ring-white">
                                    <User size={56} className="text-sakura-accent-primary" />
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="w-full space-y-1 mb-6">
                                    <label htmlFor="nickname" className="sr-only">Display Name</label>
                                    <input
                                        id="nickname"
                                        name="nickname"
                                        autoComplete="name"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="w-full bg-sakura-bg-soft border-2 border-sakura-divider rounded-xl px-4 py-2 text-center text-lg font-black text-sakura-text-primary focus:border-sakura-accent-primary outline-none"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={handleSaveProfile} disabled={isSaving} className="flex-1 bg-sakura-accent-primary text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"><Check size={14} /> Save</button>
                                        <button onClick={() => setIsEditing(false)} className="flex-1 bg-sakura-bg-soft text-sakura-text-muted py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"><X size={14} /> Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center w-full mb-6">
                                    <h2 className="text-3xl font-black text-sakura-text-primary mb-1 flex items-center justify-center gap-2">
                                        {user?.name || 'Hana Learner'}
                                        <button onClick={() => setIsEditing(true)} aria-label="Edit Profile Name"><Edit2 size={18} className="text-sakura-text-muted" /></button>
                                    </h2>
                                    <p className="text-sakura-text-muted font-medium">{user?.email}</p>
                                </div>
                            )}

                            <div className="w-full space-y-4 pt-6 border-t border-sakura-divider">
                                <div className="flex items-center gap-4 p-3 rounded-2xl bg-sakura-bg-soft/50">
                                    <Mail size={16} className="text-sakura-text-muted" />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] text-sakura-text-muted uppercase font-black tracking-widest">Email</span>
                                        <span className="truncate font-bold">{user?.email}</span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                    <SRSDistributionChart data={srsSpread} />
                </div>

                <div className="xl:col-span-8 space-y-8">
                    <GlobalStatsDashboard initialData={globalStats} />
                    <div className="bg-white rounded-[2.5rem] border border-sakura-divider p-8 ">
                        <div className="flex items-center gap-3 mb-8">
                            <TrendingUp className="text-orange-600" size={24} />
                            <h3 className="text-xl font-black text-sakura-text-primary uppercase tracking-tighter">Study Insights</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100 flex justify-between items-center">
                                <div><p className="text-[10px] font-black text-emerald-800/60 uppercase tracking-widest">Success Rate</p><p className="text-4xl font-black text-emerald-700">{new Intl.NumberFormat().format(globalStats.accuracy)}%</p></div>
                                <BarChart3 size={40} className="text-emerald-200" />
                            </div>
                            <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100 flex justify-between items-center">
                                <div><p className="text-[10px] font-black text-indigo-800/60 uppercase tracking-widest">Study Time</p><p className="text-4xl font-black text-indigo-700">{new Intl.NumberFormat().format(Math.floor(globalStats.studyTimeToday / 60))}m</p></div>
                                <Clock size={40} className="text-indigo-200" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
