
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    GraduationCap,
    BookOpen,
    Languages,
    Settings,
    Youtube,
    MessageSquare,
    Search,
    ChevronRight,
    Flame
} from 'lucide-react';
import { clsx } from 'clsx';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Review', href: '/review', icon: Flame },
    { name: 'Decks', href: '/decks', icon: GraduationCap },
    {
        name: 'Content',
        icon: BookOpen,
        children: [
            { name: 'Kanji', href: '/content/kanji' },
            { name: 'Vocabulary', href: '/content/vocabulary' },
            { name: 'Grammar', href: '/content/grammar' },
            { name: 'Sentences', href: '/content/sentences' },
        ]
    },
    {
        name: 'Immersion',
        icon: Languages,
        children: [
            { name: 'YouTube', href: '/immersion/youtube', icon: Youtube },
            { name: 'Analyzer', href: '/immersion/analyzer', icon: Search },
            { name: 'Chatbot', href: '/immersion/chatbot', icon: MessageSquare },
        ]
    },
];

import { useUser } from '@/features/auth/AuthContext';
import { LogOut } from 'lucide-react';

export function Sidebar() {
    const pathname = usePathname();
    const { user, signOut } = useUser();

    return (
        <aside className="w-64 h-screen h-full bg-white border-r-4 border-primary-dark flex flex-col p-4 gap-6 sticky top-0 transition-all duration-300">
            <div className="flex items-center gap-3 px-2 py-4">
                <Link href="/dashboard" className="w-10 h-10 bg-primary rounded-clay border-2 border-primary-dark flex items-center justify-center text-white font-bold text-xl shadow-clay hover:scale-105 transition-transform">
                    花
                </Link>
                <h1 className="text-2xl font-black tracking-tight text-primary-dark">HanaChan</h1>
            </div>

            <nav className="flex-1 flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
                {navItems.map((item) => (
                    <div key={item.name} className="flex flex-col gap-1">
                        {item.href ? (
                            <Link
                                href={item.href}
                                className={clsx(
                                    "flex items-center justify-between p-3 rounded-clay border-2 transition-all duration-200 group",
                                    pathname === item.href
                                        ? "bg-primary text-white border-primary-dark shadow-clay"
                                        : "border-transparent hover:bg-primary-light/20 text-primary-dark"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon className={clsx("w-5 h-5", pathname === item.href ? "text-white" : "text-primary")} />
                                    <span className="font-bold">{item.name}</span>
                                </div>
                                {pathname === item.href && <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />}
                            </Link>
                        ) : (
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3 p-3 text-primary-dark/60 font-black uppercase text-xs tracking-widest mt-4">
                                    <item.icon className="w-4 h-4" />
                                    <span>{item.name}</span>
                                </div>
                                {item.children?.map((child) => (
                                    <Link
                                        key={child.name}
                                        href={child.href}
                                        className={clsx(
                                            "flex items-center gap-3 p-3 pl-10 rounded-clay border-2 transition-all duration-200",
                                            pathname === child.href
                                                ? "bg-primary/10 text-primary-dark border-primary-dark shadow-clay"
                                                : "border-transparent hover:bg-primary-light/10 text-primary-dark"
                                        )}
                                    >
                                        <span className={clsx("font-bold text-sm", pathname === child.href ? "text-primary" : "text-primary-dark/80")}>
                                            {child.name}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            <div className="flex flex-col gap-4">

                <div className="p-4 bg-white border-2 border-primary-dark rounded-clay flex items-center gap-3">
                    <img
                        src={user?.user_metadata?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hana'}
                        className="w-10 h-10 rounded-full border-2 border-primary-dark shadow-clay"
                        alt="User avatar"
                    />
                    <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-black text-primary-dark truncate">{user?.user_metadata?.display_name || 'Hana Learner'}</div>
                        <button
                            onClick={() => {
                                signOut().then(() => window.location.href = '/login');
                            }}
                            className="text-[10px] font-black text-secondary hover:underline flex items-center gap-1 mt-1"
                        >
                            <LogOut className="w-3 h-3" />
                            Log Out
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}

