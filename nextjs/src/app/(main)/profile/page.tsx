'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';
import { getUserProfile, updateUserProfile } from '@/features/auth/db';
import { fetchUserDashboardStats } from '@/features/learning/service';
import {
    User, Brain, Map, Settings, Edit3, Save, X, Loader2,
    Flame, Target, BookOpen, Zap, Star, Shield,
    CheckCircle2, AlertCircle, ChevronRight,
    Globe, Plus, Palette
} from 'lucide-react';
import { clsx } from 'clsx';
import type { UserProfile } from '@/features/auth/types';

type Tab = 'overview' | 'memories' | 'learning-path' | 'settings';

// ─── Avatar Color Palette ─────────────────────────────────────────────────────

const AVATAR_COLORS = [
    { id: 'pink', from: '#F4ACB7', to: '#D88C9A', label: 'Sakura' },
    { id: 'purple', from: '#CDB4DB', to: '#9B7DB5', label: 'Wisteria' },
    { id: 'blue', from: '#A2D2FF', to: '#5BA4CF', label: 'Sky' },
    { id: 'green', from: '#B7E4C7', to: '#52B788', label: 'Matcha' },
    { id: 'orange', from: '#FFD6A5', to: '#F4A261', label: 'Yuzu' },
    { id: 'red', from: '#FFADAD', to: '#E63946', label: 'Torii' },
    { id: 'teal', from: '#A8DADC', to: '#457B9D', label: 'Ocean' },
    { id: 'dark', from: '#6B7280', to: '#3E4A61', label: 'Ink' },
];

const NATIVE_LANGUAGES = [
    'English', 'Spanish', 'French', 'German', 'Portuguese', 'Italian',
    'Chinese (Mandarin)', 'Chinese (Cantonese)', 'Korean', 'Arabic',
    'Russian', 'Hindi', 'Dutch', 'Polish', 'Swedish', 'Other'
];

const LEARNING_GOAL_SUGGESTIONS = [
    'Pass JLPT N5', 'Pass JLPT N4', 'Pass JLPT N3', 'Pass JLPT N2', 'Pass JLPT N1',
    'Travel to Japan', 'Watch anime without subtitles', 'Read manga in Japanese',
    'Business Japanese', 'Conversational fluency', 'Read novels', 'Academic research'
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const { user, signOut } = useUser();
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        display_name: '',
        bio: '',
        native_language: '',
        avatar_color: 'pink',
        learning_goals: [] as string[],
    });
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState(false);

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
            if (profileData) {
                setEditForm({
                    display_name: profileData.display_name || user?.user_metadata?.display_name || '',
                    bio: profileData.bio || '',
                    native_language: profileData.native_language || '',
                    avatar_color: profileData.avatar_color || 'pink',
                    learning_goals: profileData.learning_goals || [],
                });
            }
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

    const handleSaveProfile = async () => {
        if (!user) return;
        setSaving(true);
        setSaveError('');
        try {
            const updates: Partial<UserProfile> = {
                display_name: editForm.display_name.trim() || undefined,
                bio: editForm.bio.trim() || undefined,
                native_language: editForm.native_language || undefined,
                avatar_color: editForm.avatar_color,
                learning_goals: editForm.learning_goals,
            };
            await updateUserProfile(user.id, updates);
            // Also update Supabase auth metadata for display_name
            if (editForm.display_name.trim()) {
                await supabase.auth.updateUser({ data: { display_name: editForm.display_name.trim() } });
            }
            setProfile(prev => prev ? { ...prev, ...updates } : null);
            setIsEditing(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (e: any) {
            setSaveError(e.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setSaveError('');
        if (profile) {
            setEditForm({
                display_name: profile.display_name || '',
                bio: profile.bio || '',
                native_language: profile.native_language || '',
                avatar_color: profile.avatar_color || 'pink',
                learning_goals: profile.learning_goals || [],
            });
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

    const avatarColor = AVATAR_COLORS.find(c => c.id === (profile?.avatar_color || 'pink')) || AVATAR_COLORS[0];

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'memories', label: 'Memories', icon: Brain },
        { id: 'learning-path', label: 'Learning Path', icon: Map },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-5 animate-page-entrance pb-8">
            {/* ── Profile Header ── */}
            <div className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
                {/* Banner */}
                <div
                    className="h-24 sm:h-32 relative overflow-hidden"
                    style={{
                        background: `linear-gradient(135deg, ${avatarColor.from}30, ${avatarColor.to}20, #A2D2FF20)`
                    }}
                >
                    <div className="absolute inset-0 dot-grid opacity-30" />
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-2xl" style={{ backgroundColor: `${avatarColor.from}20` }} />
                </div>

                {/* Avatar + info */}
                <div className="px-5 sm:px-8 pb-5 sm:pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-8 sm:-mt-10">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div
                                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl sm:text-3xl shadow-xl border-4 border-white"
                                style={{ background: `linear-gradient(135deg, ${avatarColor.from}, ${avatarColor.to})` }}
                            >
                                {initials}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#48BB78] rounded-full border-2 border-white shadow-sm" />
                        </div>

                        {/* Name + meta */}
                        <div className="flex-1 min-w-0 sm:pb-1">
                            <h1 className="text-xl sm:text-2xl font-black text-[#3E4A61] tracking-tight truncate">{displayName}</h1>
                            {profile?.bio && (
                                <p className="text-sm text-foreground/50 font-medium mt-0.5 line-clamp-2">{profile.bio}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-[9px] font-black text-foreground/40 uppercase tracking-widest">{user?.email}</span>
                                <span className="w-1 h-1 bg-border rounded-full" />
                                <span className="text-[9px] font-black text-foreground/40 uppercase tracking-widest">Joined {joinDate}</span>
                                {profile?.native_language && (
                                    <>
                                        <span className="w-1 h-1 bg-border rounded-full" />
                                        <span className="text-[9px] font-black text-foreground/40 uppercase tracking-widest flex items-center gap-1">
                                            <Globe size={8} /> {profile.native_language}
                                        </span>
                                    </>
                                )}
                            </div>
                            {profile?.learning_goals && profile.learning_goals.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {profile.learning_goals.slice(0, 3).map((goal, i) => (
                                        <span key={i} className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border" style={{ color: avatarColor.to, borderColor: `${avatarColor.from}50`, backgroundColor: `${avatarColor.from}15` }}>
                                            {goal}
                                        </span>
                                    ))}
                                    {profile.learning_goals.length > 3 && (
                                        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-border/20 text-foreground/30">
                                            +{profile.learning_goals.length - 3} more
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            {saveSuccess && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#48BB78]/10 border border-[#48BB78]/20 rounded-xl">
                                    <CheckCircle2 size={12} className="text-[#48BB78]" />
                                    <span className="text-[9px] font-black text-[#48BB78] uppercase tracking-widest">Saved!</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/15 to-[#CDB4DB]/10 border border-primary/20 rounded-2xl">
                                <Star size={14} className="text-primary" />
                                <span className="text-sm font-black text-[#3E4A61]">Level {level}</span>
                            </div>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-[#3E4A61] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm"
                            >
                                <Edit3 size={12} />
                                Edit Profile
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Edit Profile Modal ── */}
            {isEditing && (
                <EditProfileModal
                    editForm={editForm}
                    setEditForm={setEditForm}
                    saving={saving}
                    saveError={saveError}
                    onSave={handleSaveProfile}
                    onCancel={handleCancelEdit}
                />
            )}

            {/* ── Tabs ── */}
            <div className="flex gap-1 p-1 bg-white border border-border rounded-2xl shadow-sm overflow-x-auto no-scrollbar">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 whitespace-nowrap flex-1 justify-center',
                                active
                                    ? 'bg-[#3E4A61] text-white shadow-sm'
                                    : 'text-foreground/40 hover:text-foreground hover:bg-surface-muted'
                            )}
                        >
                            <Icon size={13} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* ── Tab Content ── */}
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
                    onSignOut={signOut}
                />
            )}
        </div>
    );
}

// ─── Edit Profile Modal ───────────────────────────────────────────────────────

function EditProfileModal({
    editForm,
    setEditForm,
    saving,
    saveError,
    onSave,
    onCancel,
}: {
    editForm: {
        display_name: string;
        bio: string;
        native_language: string;
        avatar_color: string;
        learning_goals: string[];
    };
    setEditForm: React.Dispatch<React.SetStateAction<typeof editForm>>;
    saving: boolean;
    saveError: string;
    onSave: () => void;
    onCancel: () => void;
}) {
    const [goalInput, setGoalInput] = useState('');

    const addGoal = (goal: string) => {
        const trimmed = goal.trim();
        if (!trimmed || editForm.learning_goals.includes(trimmed)) return;
        setEditForm(prev => ({ ...prev, learning_goals: [...prev.learning_goals, trimmed] }));
        setGoalInput('');
    };

    const removeGoal = (goal: string) => {
        setEditForm(prev => ({ ...prev, learning_goals: prev.learning_goals.filter(g => g !== goal) }));
    };

    const selectedColor = AVATAR_COLORS.find(c => c.id === editForm.avatar_color) || AVATAR_COLORS[0];
    const initials = (editForm.display_name || 'U').slice(0, 2).toUpperCase();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white rounded-t-3xl z-10">
                    <div>
                        <h2 className="text-base font-black text-[#3E4A61] uppercase tracking-tight">Edit Profile</h2>
                        <p className="text-[9px] font-black text-foreground/30 uppercase tracking-widest mt-0.5">Customize your learner identity</p>
                    </div>
                    <button onClick={onCancel} className="p-2 hover:bg-[#F7FAFC] rounded-xl transition-colors text-foreground/40">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Avatar Preview + Color */}
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-xl"
                            style={{ background: `linear-gradient(135deg, ${selectedColor.from}, ${selectedColor.to})` }}
                        >
                            {initials}
                        </div>
                        <div className="space-y-2 w-full">
                            <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest flex items-center gap-1.5">
                                <Palette size={10} /> Avatar Color
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {AVATAR_COLORS.map(color => (
                                    <button
                                        key={color.id}
                                        onClick={() => setEditForm(prev => ({ ...prev, avatar_color: color.id }))}
                                        title={color.label}
                                        className={clsx(
                                            'w-8 h-8 rounded-xl transition-all',
                                            editForm.avatar_color === color.id
                                                ? 'ring-2 ring-offset-2 ring-[#3E4A61] scale-110'
                                                : 'hover:scale-105'
                                        )}
                                        style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Display Name */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest">Display Name</label>
                        <input
                            type="text"
                            value={editForm.display_name}
                            onChange={e => setEditForm(prev => ({ ...prev, display_name: e.target.value }))}
                            placeholder="Your display name"
                            maxLength={50}
                            className="w-full px-4 py-3 bg-[#F7FAFC] border border-border rounded-2xl text-sm font-bold text-[#3E4A61] outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest">Bio</label>
                        <textarea
                            value={editForm.bio}
                            onChange={e => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                            placeholder="Tell us about yourself and your Japanese learning journey..."
                            maxLength={200}
                            rows={3}
                            className="w-full px-4 py-3 bg-[#F7FAFC] border border-border rounded-2xl text-sm font-medium text-[#3E4A61] outline-none focus:border-primary transition-colors resize-none"
                        />
                        <p className="text-[8px] text-foreground/20 font-black uppercase tracking-widest text-right">{editForm.bio.length}/200</p>
                    </div>

                    {/* Native Language */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest flex items-center gap-1.5">
                            <Globe size={10} /> Native Language
                        </label>
                        <select
                            value={editForm.native_language}
                            onChange={e => setEditForm(prev => ({ ...prev, native_language: e.target.value }))}
                            className="w-full px-4 py-3 bg-[#F7FAFC] border border-border rounded-2xl text-sm font-bold text-[#3E4A61] outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
                        >
                            <option value="">Select your native language</option>
                            {NATIVE_LANGUAGES.map(lang => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                    </div>

                    {/* Learning Goals */}
                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest flex items-center gap-1.5">
                            <Target size={10} /> Learning Goals
                        </label>

                        {/* Current goals */}
                        {editForm.learning_goals.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {editForm.learning_goals.map(goal => (
                                    <div key={goal} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl">
                                        <span className="text-[10px] font-black text-primary">{goal}</span>
                                        <button
                                            onClick={() => removeGoal(goal)}
                                            className="text-primary/50 hover:text-primary transition-colors"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add custom goal */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={goalInput}
                                onChange={e => setGoalInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addGoal(goalInput)}
                                placeholder="Add a custom goal..."
                                className="flex-1 px-3 py-2 bg-[#F7FAFC] border border-border rounded-xl text-xs font-bold text-[#3E4A61] outline-none focus:border-primary transition-colors"
                            />
                            <button
                                onClick={() => addGoal(goalInput)}
                                disabled={!goalInput.trim()}
                                className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-black disabled:opacity-40 hover:opacity-90 transition-opacity"
                            >
                                <Plus size={12} />
                            </button>
                        </div>

                        {/* Suggestions */}
                        <div className="space-y-1.5">
                            <p className="text-[8px] font-black text-foreground/20 uppercase tracking-widest">Suggestions</p>
                            <div className="flex flex-wrap gap-1.5">
                                {LEARNING_GOAL_SUGGESTIONS.filter(g => !editForm.learning_goals.includes(g)).slice(0, 8).map(goal => (
                                    <button
                                        key={goal}
                                        onClick={() => addGoal(goal)}
                                        className="px-2.5 py-1 bg-[#F7FAFC] border border-border hover:border-primary/30 rounded-lg text-[9px] font-bold text-foreground/40 hover:text-foreground transition-all"
                                    >
                                        + {goal}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Error */}
                    {saveError && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-2xl">
                            <AlertCircle size={14} className="text-red-400 shrink-0" />
                            <span className="text-xs font-bold text-red-500">{saveError}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 p-6 border-t border-border sticky bottom-0 bg-white rounded-b-3xl">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3 bg-[#F7FAFC] border border-border rounded-2xl text-xs font-black uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        disabled={saving}
                        className="flex-1 py-3 bg-[#3E4A61] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save Profile
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

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
                                'flex items-center gap-3 p-3 rounded-2xl border transition-all',
                                a.earned
                                    ? 'bg-gradient-to-br from-primary/8 to-transparent border-primary/20'
                                    : 'bg-[#F7FAFC] border-border/30 opacity-50'
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

// ─── Memories Tab ─────────────────────────────────────────────────────────────

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

// ─── Learning Path Tab ────────────────────────────────────────────────────────

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
                                'flex items-center gap-3 p-3 rounded-2xl border transition-all',
                                isCompleted && 'bg-[#48BB78]/5 border-[#48BB78]/20',
                                isCurrent && 'bg-gradient-to-r from-primary/10 to-[#CDB4DB]/5 border-primary/25',
                                isLocked && 'bg-[#F7FAFC] border-border/20 opacity-50'
                            )}
                        >
                            <div className={clsx(
                                'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0',
                                isCompleted && 'bg-[#48BB78] text-white',
                                isCurrent && 'bg-primary text-white shadow-md shadow-primary/30',
                                isLocked && 'bg-border/30 text-foreground/30'
                            )}>
                                {isCompleted ? <CheckCircle2 size={14} /> : lvl}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={clsx(
                                    'text-xs font-black',
                                    isCompleted && 'text-[#48BB78]',
                                    isCurrent && 'text-[#3E4A61]',
                                    isLocked && 'text-foreground/30'
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

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ user, profile, onSignOut }: any) {
    return (
        <div className="space-y-4">
            {/* Account info */}
            <div className="bg-white border border-border rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-black text-[#3E4A61] uppercase tracking-tight">Account Information</h3>

                <div className="space-y-3">
                    {[
                        { label: 'Email', value: user?.email, note: 'Read-only' },
                        { label: 'User ID', value: user?.id?.slice(0, 8) + '...', note: 'Internal' },
                        { label: 'Current Level', value: `Level ${profile?.level || 1}`, note: 'Auto-managed' },
                        { label: 'Account Role', value: profile?.role || 'USER', note: 'System' },
                    ].map((item, i) => (
                        <div key={i} className="space-y-1">
                            <label className="text-[9px] font-black text-foreground/40 uppercase tracking-widest">{item.label}</label>
                            <div className="flex items-center justify-between p-3 bg-[#F7FAFC] border border-border rounded-2xl">
                                <span className="text-sm font-bold text-[#3E4A61]">{item.value}</span>
                                <span className="text-[8px] font-black text-foreground/20 uppercase tracking-widest">{item.note}</span>
                            </div>
                        </div>
                    ))}
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
