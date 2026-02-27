'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { getUserProfile, updateUserProfile } from '@/features/auth/db';
import { fetchUserDashboardStats } from '@/features/learning/service';
import {
    User, Brain, Map, Settings, Edit3, Save, X, Loader2,
    Trophy, Flame, Target, BookOpen, Zap, Star, Shield,
    Calendar, Clock, TrendingUp, CheckCircle2, AlertCircle,
    ChevronRight, Trash2, RefreshCw, Eye, EyeOff
} from 'lucide-react';
import { clsx } from 'clsx';
import { HanaTime } from '@/lib/time';

type Tab = 'overview' | 'memories' | 'learning-path' | 'settings';

export default function ProfilePage() {
    const { user, signOut } = useUser();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    // Settings state
    const [editingName, setEditingName] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState('');
    const [savingName, setSavingName] = useState(false);
    const [nameError, setNameError] = useState('');
    const [nameSuccess, setNameSuccess] = useState(false);

    // Memory state
    const [memories, setMemories] = useState<any>(null);
    const [loadingMemories, setLoadingMemories] = useState(false);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [profileData, statsData] = await Promise.all([
                getUserProfile(user.id),
                fetchUserDashboardStats(user.id)
            ]);
            setProfile(profileData);
            setStats(statsData);
            setNewDisplayName(profileData?.display_name || user?.user_metadata?.display_name || '');
        } catch (e) {
            console.error('Failed to load profile:', e);
        } finally {
            setLoading(false);
        }
    };

    const loadMemories = async () => {
        if (!user || memories) return;
        setLoadingMemories(true);
        try {
            const res = await fetch(`/api/memory/profile?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setMemories(data);
            }
        } catch (e) {
            // Memory API may not be running - show placeholder
            setMemories({ goals: [], interests: [], facts: [], preferences: [] });
        } finally {
            setLoadingMemories(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        if (user) loadData();
    }, [user]);

    useEffect(() => {
        if (activeTab === 'memories' && user) loadMemories();
    }, [activeTab, user]);

    const handleSaveName = async () => {
        if (!user || !newDisplayName.trim()) return;
        setSavingName(true);
        setNameError('');
        try {
            await updateUserProfile(user.id, { display_name: newDisplayName.trim() });
            await supabase.auth.updateUser({ data: { display_name: newDisplayName.trim() } });
            setProfile((p: any) => ({ ...p, display_name: newDisplayName.trim() }));
            setEditingName(false);
            setNameSuccess(true);
            setTimeout(() => setNameSuccess(false), 3000);
        } catch (e: any) {
            setNameError(e.message || 'Failed to update name');
        } finally {
            setSavingName(false);
        }
    };

    if (!mounted || loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary rounded-2xl blur-xl opacity-20 animate-pulse" />
                        <div className="relative w-12 h-12 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">花</div>
                    </div>
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Learner';
    const initials = displayName.slice(0, 2).toUpperCase();
    const joinDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown';
    const level = profile?.level || 1;

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'memories', label: 'Memories', icon: Brain },
        { id: 'learning-path', label: 'Learning Path', icon: Map },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-5 animate-page-entrance pb-8">
            {/* Profile Header */}
            <div className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
                {/* Banner */}
                <div className="h-24 sm:h-32 bg-gradient-to-br from-[#F4ACB7]/30 via-[#CDB4DB]/20 to-[#A2D2FF]/20 relative overflow-hidden">
                    <div className="absolute inset-0 dot-grid opacity-30" />
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
                </div>

                {/* Avatar + info */}
                <div className="px-5 sm:px-8 pb-5 sm:pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-8 sm:-mt-10">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-xl border-4 border-white">
                                {initials}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#48BB78] rounded-full border-2 border-white shadow-sm" />
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0 sm:pb-1">
                            <h1 className="text-xl sm:text-2xl font-black text-[#3E4A61] tracking-tight truncate">{displayName}</h1>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-[9px] font-black text-foreground/40 uppercase tracking-widest">{user?.email}</span>
                                <span className="w-1 h-1 bg-border rounded-full" />
                                <span className="text-[9px] font-black text-foreground/40 uppercase tracking-widest">Joined {joinDate}</span>
                            </div>
                        </div>

                        {/* Level badge */}
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/15 to-[#CDB4DB]/10 border border-primary/20 rounded-2xl shrink-0">
                            <Star size={14} className="text-primary" />
                            <span className="text-sm font-black text-[#3E4A61]">Level {level}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-white border border-border rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap flex-1 justify-center",
                                active
                                    ? "bg-[#3E4A61] text-white shadow-sm"
                                    : "text-foreground/40 hover:text-foreground hover:bg-surface-muted"
                            )}
                        >
                            <Icon size={13} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <OverviewTab stats={stats} profile={profile} level={level} displayName={displayName} />
            )}
            {activeTab === 'memories' && (
                <MemoriesTab memories={memories} loading={loadingMemories} userId={user?.id} />
            )}
            {activeTab === 'learning-path' && (
                <LearningPathTab stats={stats} level={level} />
            )}
            {activeTab === 'settings' && (
                <SettingsTab
                    user={user}
                    profile={profile}
                    displayName={displayName}
                    editingName={editingName}
                    newDisplayName={newDisplayName}
                    savingName={savingName}
                    nameError={nameError}
                    nameSuccess={nameSuccess}
                    onEditName={() => setEditingName(true)}
                    onCancelEdit={() => { setEditingName(false); setNewDisplayName(profile?.display_name || ''); }}
                    onNameChange={setNewDisplayName}
                    onSaveName={handleSaveName}
                    onSignOut={signOut}
                />
            )}
        </div>
    );
}

// ===== OVERVIEW TAB =====
function OverviewTab({ stats, profile, level, displayName }: any) {
    const achievements = [
        { icon: '🌸', label: 'First Lesson', desc: 'Completed your first lesson', earned: true },
        { icon: '⚔️', label: 'Warrior', desc: 'Completed 10 review sessions', earned: (stats?.reviewsToday || 0) >= 1 },
        { icon: '🔥', label: 'On Fire', desc: '7-day streak', earned: (stats?.streak || 0) >= 7 },
        { icon: '🎯', label: 'Sharpshooter', desc: '90%+ accuracy', earned: (stats?.retention || 0) >= 90 },
        { icon: '📚', label: 'Scholar', desc: 'Learned 50+ items', earned: (stats?.totalLearned || 0) >= 50 },
        { icon: '🏆', label: 'Champion', desc: 'Reached Level 5', earned: level >= 5 },
    ];

    return (
        <div className="space-y-4">
            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Level', value: level, icon: Star, color: '#F4ACB7' },
                    { label: 'Streak', value: `${stats?.streak || 0}d`, icon: Flame, color: '#FF7EB9' },
                    { label: 'Learned', value: stats?.totalLearned || 0, icon: BookOpen, color: '#A2D2FF' },
                    { label: 'Accuracy', value: `${stats?.retention || 0}%`, icon: Target, color: '#48BB78' },
                ].map((s) => (
                    <div key={s.label} className="bg-white border border-border rounded-3xl p-4 text-center shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${s.color}40, transparent)` }} />
                        <s.icon size={16} className="mx-auto mb-2" style={{ color: s.color }} />
                        <div className="text-xl font-black text-[#3E4A61]" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-[8px] font-black uppercase tracking-widest text-foreground/30 mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* SRS Distribution */}
            <div className="bg-white border border-border rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-[#3E4A61] uppercase tracking-tight">SRS Distribution</h3>
                <div className="space-y-2.5">
                    {[
                        { label: 'Apprentice', key: 'apprentice', color: '#FF7EB9' },
                        { label: 'Guru', key: 'guru', color: '#B197FC' },
                        { label: 'Master', key: 'master', color: '#4DABF7' },
                        { label: 'Enlightened', key: 'enlightened', color: '#91A7FF' },
                        { label: 'Burned', key: 'burned', color: '#868E96' },
                    ].map((s) => {
                        const count = stats?.srsSpread?.[s.key] || 0;
                        const total = Object.values(stats?.srsSpread || {}).reduce((a: any, b: any) => a + b, 0) as number;
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                        return (
                            <div key={s.key} className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50 w-24 shrink-0">{s.label}</span>
                                <div className="flex-1 h-2 bg-[#F7FAFC] rounded-full overflow-hidden border border-border/10">
                                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.max(2, pct)}%`, backgroundColor: s.color }} />
                                </div>
                                <span className="text-[10px] font-black text-[#3E4A61] w-8 text-right shrink-0">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Achievements */}
            <div className="bg-white border border-border rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-[#3E4A61] uppercase tracking-tight">Achievements</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {achievements.map((a, i) => (
                        <div
                            key={i}
                            className={clsx(
                                "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                                a.earned
                                    ? "bg-gradient-to-br from-primary/8 to-transparent border-primary/20"
                                    : "bg-[#F7FAFC] border-border/30 opacity-50"
                            )}
                        >
                            <span className="text-xl shrink-0">{a.icon}</span>
                            <div className="min-w-0">
                                <p className="text-[10px] font-black text-[#3E4A61] truncate">{a.label}</p>
                                <p className="text-[8px] font-bold text-foreground/30 truncate">{a.desc}</p>
                            </div>
                            {a.earned && <CheckCircle2 size={12} className="text-[#48BB78] shrink-0 ml-auto" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ===== MEMORIES TAB =====
function MemoriesTab({ memories, loading, userId }: any) {
    if (loading) {
        return (
            <div className="bg-white border border-border rounded-3xl p-8 shadow-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={24} className="animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30">Loading memories...</p>
                </div>
            </div>
        );
    }

    const sections = [
        { key: 'goals', label: 'Goals', icon: Target, color: '#F4ACB7', empty: 'No goals recorded yet.' },
        { key: 'interests', label: 'Interests', icon: Star, color: '#CDB4DB', empty: 'No interests recorded yet.' },
        { key: 'facts', label: 'Facts About You', icon: Brain, color: '#A2D2FF', empty: 'No facts recorded yet.' },
        { key: 'preferences', label: 'Preferences', icon: Settings, color: '#B7E4C7', empty: 'No preferences recorded yet.' },
    ];

    return (
        <div className="space-y-4">
            {/* Info banner */}
            <div className="bg-gradient-to-r from-[#CDB4DB]/10 to-[#A2D2FF]/10 border border-[#CDB4DB]/20 rounded-3xl p-4 flex items-start gap-3">
                <Brain size={16} className="text-[#9B7DB5] shrink-0 mt-0.5" />
                <div>
                    <p className="text-xs font-black text-[#3E4A61]">AI Memory System</p>
                    <p className="text-[10px] text-foreground/50 font-medium mt-0.5 leading-relaxed">
                        Hanachan AI remembers facts about you from your conversations to provide personalized tutoring. These memories are automatically extracted and stored.
                    </p>
                </div>
            </div>

            {sections.map((section) => {
                const items = memories?.[section.key] || [];
                return (
                    <div key={section.key} className="bg-white border border-border rounded-3xl p-5 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${section.color}20` }}>
                                    <section.icon size={13} style={{ color: section.color }} />
                                </div>
                                <h3 className="text-sm font-black text-[#3E4A61] uppercase tracking-tight">{section.label}</h3>
                            </div>
                            <span className="text-[9px] font-black text-foreground/30 uppercase tracking-widest">{items.length} items</span>
                        </div>

                        {items.length > 0 ? (
                            <div className="space-y-1.5">
                                {items.map((item: string, i: number) => (
                                    <div key={i} className="flex items-start gap-2.5 p-3 bg-surface-muted/40 rounded-2xl border border-border/20">
                                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: section.color }} />
                                        <p className="text-sm text-foreground/70 font-medium leading-snug flex-1">{item}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-4 text-center">
                                <p className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest">{section.empty}</p>
                                <p className="text-[9px] text-foreground/15 mt-1">Chat with Hanachan AI to build your memory profile.</p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ===== LEARNING PATH TAB =====
function LearningPathTab({ stats, level }: any) {
    const levels = Array.from({ length: 10 }, (_, i) => {
        const lvl = i + 1;
        const isCompleted = lvl < level;
        const isCurrent = lvl === level;
        const isLocked = lvl > level;
        return { lvl, isCompleted, isCurrent, isLocked };
    });

    const typeStats = stats?.levelStats?.typeStats || {};

    return (
        <div className="space-y-4">
            {/* Current level progress */}
            <div className="bg-white border border-border rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-[#3E4A61] uppercase tracking-tight">Current Level Progress</h3>
                    <span className="text-sm font-black text-primary">Level {level}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { type: 'Radicals', key: 'radical', color: '#A2D2FF' },
                        { type: 'Kanji', key: 'kanji', color: '#F4ACB7' },
                        { type: 'Vocab', key: 'vocabulary', color: '#CDB4DB' },
                        { type: 'Grammar', key: 'grammar', color: '#B7E4C7' },
                    ].map((cat) => {
                        const data = typeStats[cat.key] || { mastered: 0, total: 0 };
                        const pct = Math.round((data.mastered / Math.max(data.total, 1)) * 100);
                        return (
                            <div key={cat.key} className="p-3 rounded-2xl border bg-white/60 space-y-2" style={{ borderColor: `${cat.color}30` }}>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-foreground/40">{cat.type}</span>
                                    <span className="text-[9px] font-black" style={{ color: cat.color }}>{pct}%</span>
                                </div>
                                <div className="text-base font-black text-[#3E4A61]">
                                    {data.mastered}<span className="text-[9px] text-foreground/30 ml-0.5">/{data.total}</span>
                                </div>
                                <div className="h-1 w-full bg-[#F7FAFC] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    <p className="text-[9px] font-black text-foreground/30 uppercase tracking-widest">
                        Guru 90% of kanji to unlock Level {level + 1}
                    </p>
                </div>
            </div>

            {/* Level roadmap */}
            <div className="bg-white border border-border rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-[#3E4A61] uppercase tracking-tight">Level Roadmap</h3>
                <div className="space-y-2">
                    {levels.map(({ lvl, isCompleted, isCurrent, isLocked }) => (
                        <div
                            key={lvl}
                            className={clsx(
                                "flex items-center gap-3 p-3 rounded-2xl border transition-all",
                                isCompleted && "bg-[#48BB78]/5 border-[#48BB78]/20",
                                isCurrent && "bg-gradient-to-r from-primary/10 to-[#CDB4DB]/5 border-primary/25",
                                isLocked && "bg-[#F7FAFC] border-border/20 opacity-50"
                            )}
                        >
                            <div className={clsx(
                                "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0",
                                isCompleted && "bg-[#48BB78] text-white",
                                isCurrent && "bg-primary text-white shadow-md shadow-primary/30",
                                isLocked && "bg-border/30 text-foreground/30"
                            )}>
                                {isCompleted ? <CheckCircle2 size={14} /> : lvl}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={clsx(
                                    "text-xs font-black",
                                    isCompleted && "text-[#48BB78]",
                                    isCurrent && "text-[#3E4A61]",
                                    isLocked && "text-foreground/30"
                                )}>
                                    Level {lvl}
                                    {isCurrent && <span className="ml-2 text-[8px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-md uppercase tracking-widest">Current</span>}
                                    {isCompleted && <span className="ml-2 text-[8px] bg-[#48BB78]/15 text-[#48BB78] px-1.5 py-0.5 rounded-md uppercase tracking-widest">Done</span>}
                                </p>
                                <p className="text-[9px] text-foreground/30 font-medium mt-0.5">
                                    {isCompleted ? 'Completed' : isCurrent ? 'In progress' : 'Locked'}
                                </p>
                            </div>
                            {isCurrent && <ChevronRight size={14} className="text-primary shrink-0" />}
                        </div>
                    ))}
                    <div className="flex items-center gap-3 p-3 rounded-2xl border border-dashed border-border/30 opacity-40">
                        <div className="w-8 h-8 rounded-xl bg-border/20 flex items-center justify-center text-xs font-black text-foreground/20 shrink-0">...</div>
                        <p className="text-xs font-black text-foreground/20">Levels 11–60 await</p>
                    </div>
                </div>
            </div>

            {/* Study tips */}
            <div className="bg-gradient-to-br from-[#3E4A61] to-[#2D3748] rounded-3xl p-5 text-white shadow-xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                <div className="flex items-center gap-2">
                    <Zap size={14} className="text-primary" />
                    <h3 className="text-sm font-black text-white/90 uppercase tracking-tight">Study Tips</h3>
                </div>
                <div className="space-y-2">
                    {[
                        'Review daily to maintain your streak and retention rate.',
                        'Complete lessons in batches of 5 for optimal cognitive load.',
                        'Guru 90% of kanji to unlock the next level.',
                        'Use the chatbot to practice grammar in context.',
                    ].map((tip, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                            <p className="text-xs text-white/60 font-medium leading-snug">{tip}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ===== SETTINGS TAB =====
function SettingsTab({
    user, profile, displayName, editingName, newDisplayName, savingName,
    nameError, nameSuccess, onEditName, onCancelEdit, onNameChange, onSaveName, onSignOut
}: any) {
    return (
        <div className="space-y-4">
            {/* Account info */}
            <div className="bg-white border border-border rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-[#3E4A61] uppercase tracking-tight">Account Information</h3>

                {/* Display name */}
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest">Display Name</label>
                    {editingName ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newDisplayName}
                                onChange={(e) => onNameChange(e.target.value)}
                                className="flex-1 px-4 py-2.5 bg-[#F7FAFC] border border-border rounded-2xl text-sm font-bold text-[#3E4A61] outline-none focus:border-primary transition-colors"
                                placeholder="Your display name"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && onSaveName()}
                            />
                            <button
                                onClick={onSaveName}
                                disabled={savingName}
                                className="px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                            >
                                {savingName ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                Save
                            </button>
                            <button
                                onClick={onCancelEdit}
                                className="px-3 py-2.5 bg-[#F7FAFC] border border-border rounded-2xl text-foreground/40 hover:text-foreground transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-3 bg-[#F7FAFC] border border-border rounded-2xl">
                            <span className="text-sm font-bold text-[#3E4A61]">{displayName}</span>
                            <button
                                onClick={onEditName}
                                className="flex items-center gap-1.5 text-[9px] font-black text-foreground/40 hover:text-primary transition-colors uppercase tracking-widest"
                            >
                                <Edit3 size={11} />
                                Edit
                            </button>
                        </div>
                    )}
                    {nameError && (
                        <div className="flex items-center gap-2 text-red-500">
                            <AlertCircle size={12} />
                            <span className="text-[10px] font-bold">{nameError}</span>
                        </div>
                    )}
                    {nameSuccess && (
                        <div className="flex items-center gap-2 text-[#48BB78]">
                            <CheckCircle2 size={12} />
                            <span className="text-[10px] font-bold">Name updated successfully!</span>
                        </div>
                    )}
                </div>

                {/* Email (read-only) */}
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest">Email</label>
                    <div className="flex items-center justify-between p-3 bg-[#F7FAFC] border border-border rounded-2xl">
                        <span className="text-sm font-bold text-[#3E4A61]">{user?.email}</span>
                        <span className="text-[8px] font-black text-foreground/20 uppercase tracking-widest">Read-only</span>
                    </div>
                </div>

                {/* Level (read-only) */}
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest">Current Level</label>
                    <div className="flex items-center justify-between p-3 bg-[#F7FAFC] border border-border rounded-2xl">
                        <div className="flex items-center gap-2">
                            <Star size={14} className="text-primary" />
                            <span className="text-sm font-bold text-[#3E4A61]">Level {profile?.level || 1}</span>
                        </div>
                        <span className="text-[8px] font-black text-foreground/20 uppercase tracking-widest">Auto-managed</span>
                    </div>
                </div>
            </div>

            {/* Preferences */}
            <div className="bg-white border border-border rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-[#3E4A61] uppercase tracking-tight">Preferences</h3>
                <div className="space-y-2">
                    {[
                        { label: 'Daily Review Goal', value: '100 items', note: 'Coming soon' },
                        { label: 'Lesson Batch Size', value: '5 items', note: 'Fixed' },
                        { label: 'SRS Algorithm', value: 'FSRS v4', note: 'System default' },
                        { label: 'Time Zone', value: 'UTC', note: 'Auto-detected' },
                    ].map((pref, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-[#F7FAFC] border border-border/30 rounded-2xl">
                            <span className="text-xs font-black text-[#3E4A61]">{pref.label}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-foreground/50">{pref.value}</span>
                                <span className="text-[8px] font-black text-foreground/20 uppercase tracking-widest bg-border/20 px-1.5 py-0.5 rounded-md">{pref.note}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Danger zone */}
            <div className="bg-white border border-red-100 rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-red-400 uppercase tracking-tight">Account Actions</h3>
                <div className="space-y-2">
                    <button
                        onClick={onSignOut}
                        className="w-full flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-2xl hover:bg-red-100 transition-colors group"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-red-100 rounded-xl flex items-center justify-center group-hover:bg-red-200 transition-colors">
                                <Shield size={13} className="text-red-400" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-black text-red-500">Sign Out</p>
                                <p className="text-[9px] text-red-300 font-medium">End your current session</p>
                            </div>
                        </div>
                        <ChevronRight size={14} className="text-red-300" />
                    </button>
                </div>
            </div>
        </div>
    );
}
