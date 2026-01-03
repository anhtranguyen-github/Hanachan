'use client';

import React from 'react';
import { Button } from '@/ui/components/ui/button';
import { User, Settings, CreditCard, LogOut, Shield } from 'lucide-react';
import { PageHeader } from '@/ui/components/PageHeader';

export default function ProfilePage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <PageHeader
                title="Account Settings"
                subtitle="Manage your profile, preferences, and billing"
                icon={Settings}
                iconColor="text-slate-400"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Sidebar Nav */}
                <div className="space-y-2">
                    {[
                        { icon: User, label: 'Profile' },
                        { icon: Settings, label: 'Preferences' },
                        { icon: CreditCard, label: 'Billing' },
                        { icon: Shield, label: 'Privacy' },
                    ].map((item, i) => (
                        <button key={i} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-colors ${i === 0 ? 'bg-white shadow-sm text-rose-500' : 'text-slate-400 hover:bg-white/50'}`}>
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="md:col-span-2 space-y-6">
                    <div className="app-card p-8 flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-rose-100 border-4 border-white shadow-sm flex items-center justify-center text-2xl font-black text-rose-400">
                            H
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Hanachan User</h2>
                            <p className="text-slate-400 text-sm">learner@hanachan.app</p>
                            <div className="mt-2 flex gap-2">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-bold uppercase">Free Plan</span>
                            </div>
                        </div>
                        <div className="ml-auto">
                            <Button variant="outline" className="border-slate-200 text-slate-600 hover:bg-slate-50">Edit</Button>
                        </div>
                    </div>

                    <div className="app-card p-8 space-y-6">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b pb-4">General</h3>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Display Name</label>
                                <input className="w-full bg-slate-50 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 border-none outline-none focus:ring-2 focus:ring-rose-200" defaultValue="Hanachan User" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase">Native Language</label>
                                <select className="w-full bg-slate-50 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 border-none outline-none focus:ring-2 focus:ring-rose-200">
                                    <option>English</option>
                                    <option>Spanish</option>
                                    <option>French</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button className="btn-primary">Save Changes</Button>
                        </div>
                    </div>

                    {/* ... Danger Zone ... */}
                    <div className="app-card p-8 border-red-100 bg-red-50/10">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest">Danger Zone</h3>
                                <p className="text-xs text-red-400 mt-1">Delete your account and all data.</p>
                            </div>
                            <Button variant="ghost" className="text-red-500 hover:bg-red-50">Delete Account</Button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
