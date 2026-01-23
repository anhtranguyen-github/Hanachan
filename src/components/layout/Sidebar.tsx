'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    Languages,
    MessageSquare,
    Flame,
    LogOut,
    ChevronRight,
    Search
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUser } from '@/features/auth/AuthContext';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Training', href: '/review', icon: Flame },
    {
        name: 'Library',
        icon: BookOpen,
        children: [
            { name: 'All Content', href: '/content' },
            { name: 'Radicals', href: '/content?type=radical' },
            { name: 'Kanji', href: '/content?type=kanji' },
            { name: 'Vocabulary', href: '/content?type=vocabulary' },
            { name: 'Grammar', href: '/content?type=grammar' },
        ]
    },
    {
        name: 'Immersion',
        icon: Languages,
        children: [
            { name: 'Chatbot', href: '/immersion/chatbot', icon: MessageSquare },
        ]
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { signOut } = useUser();

    return (
        <aside className="w-[280px] h-screen bg-surface border-r border-border flex flex-col p-6 sticky top-0 overflow-y-auto">
            {/* Branding */}
            <div className="flex items-center gap-3 px-2 mb-12">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center rotate-3 border-b-2 border-primary-dark">
                    <span className="text-foreground font-black text-xl italic uppercase">花</span>
                </div>
                <div>
                    <h1 className="text-xl font-black tracking-tight text-foreground">HANACHAN</h1>
                    <p className="text-[9px] font-bold uppercase text-primary-dark tracking-widest">Master Japanese</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-8">
                {navItems.map((item) => (
                    <div key={item.name} className="space-y-2">
                        {item.href ? (
                            <Link
                                href={item.href}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group border border-transparent",
                                    pathname === item.href
                                        ? "bg-primary/20 text-foreground border-primary/10"
                                        : "text-foreground/60 hover:text-foreground hover:bg-surface-muted"
                                )}
                            >
                                <item.icon size={20} className={clsx(pathname === item.href ? "text-primary-dark" : "text-foreground/40 group-hover:text-foreground/60")} />
                                <span className="font-bold text-sm tracking-tight">{item.name}</span>
                                {pathname === item.href && <ChevronRight size={14} className="ml-auto text-primary-dark opacity-60" />}
                            </Link>
                        ) : (
                            <div className="space-y-1 pt-2">
                                <div className="px-4 text-[10px] font-bold uppercase text-foreground/30 tracking-widest mb-2">{item.name}</div>
                                {item.children?.map((child) => (
                                    <Link
                                        key={child.href}
                                        href={child.href}
                                        className={clsx(
                                            "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm group border border-transparent",
                                            pathname === child.href
                                                ? "text-foreground bg-primary/10 border-primary/5 font-bold"
                                                : "text-foreground/60 hover:text-foreground hover:bg-surface-muted"
                                        )}
                                    >
                                        <div className={clsx("w-1.5 h-1.5 rounded-full transition-all", pathname === child.href ? "bg-primary-dark" : "bg-border")} />
                                        <span className="font-medium">{child.name}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="pt-6 border-t border-border">
                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-foreground/40 hover:text-primary-dark hover:bg-primary/5 transition-all group"
                >
                    <LogOut size={18} className="text-foreground/20 group-hover:text-primary-dark" />
                    <span className="font-bold text-xs uppercase tracking-widest">Sign Out</span>
                </button>
            </div>
        </aside>
    );
}
