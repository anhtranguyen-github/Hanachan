'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    MessageSquare,
    BookOpen,
    Swords,
    Layers,
    Sparkles,
    User,
    LogOut,
    ChevronDown,
    Menu,
    X,
    LayoutDashboard,
    TrendingUp,
    Video,
    BookMarked,
    Mic,
    PenTool
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUser } from '@/features/auth/AuthContext';

const NAV_ITEMS = [
    { name: 'Progress', href: '/dashboard', icon: LayoutDashboard, color: '#F4ACB7' },
    { name: 'Learn', href: '/learn', icon: BookOpen, color: '#A2D2FF' },
    { name: 'Review', href: '/review', icon: Swords, color: '#CDB4DB' },
    { name: 'Decks', href: '/decks', icon: Layers, color: '#FFD6A5' },
    { name: 'Library', href: '/library', icon: BookMarked, color: '#7BB8F0' },
    { name: 'Chat', href: '/chat', icon: MessageSquare, color: '#B7E4C7' },
    {
        name: 'Immersion',
        href: '#',
        icon: Sparkles,
        color: '#FFD6A5',
        children: [
            { name: 'Videos', href: '/videos', icon: Video, color: '#FF9F9F' },
            { name: 'Reading', href: '/reading', icon: BookMarked, color: '#7BB8F0' },
            { name: 'Speaking', href: '/immersion/speaking', icon: Mic, color: '#FFB5B5' },
            { name: 'Sentences', href: '/sentences', icon: PenTool, color: '#A2D2FF' },
        ]
    },
];

export function Header() {
    const pathname = usePathname();
    const { user, signOut } = useUser();
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [immersionOpen, setImmersionOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 10);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileOpen(false);
        setUserMenuOpen(false);
        setImmersionOpen(false);
    }, [pathname]);

    const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Learner';

    return (
        <header className={clsx(
            "sticky top-0 left-0 right-0 z-50 transition-all duration-300 shrink-0",
            scrolled ? "bg-white/80 backdrop-blur-xl border-b border-border/40 shadow-sm h-14" : "bg-white border-b border-border/20 h-16"
        )}>
            <div className="max-w-[1600px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
                {/* Branding */}
                <Link href="/chat" className="flex items-center gap-3 group">
                    <div className="relative shrink-0">
                        <div className="absolute inset-0 bg-primary rounded-xl blur-md opacity-20 group-hover:opacity-40 transition-opacity" />
                        <div className="relative w-9 h-9 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                            花
                        </div>
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-[11px] font-black tracking-[0.2em] text-[#3E4A61] leading-none uppercase">
                            HANACHAN
                        </h1>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || (item.children && item.children.some(c => pathname.startsWith(c.href)));

                        if (item.children) {
                            return (
                                <div key={item.name} className="relative">
                                    <button
                                        onMouseEnter={() => setImmersionOpen(true)}
                                        onClick={() => setImmersionOpen(!immersionOpen)}
                                        className={clsx(
                                            "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                            isActive ? "text-primary" : "text-[#A0AEC0] hover:text-[#3E4A61] hover:bg-[#F7FAFC]"
                                        )}
                                    >
                                        <item.icon size={14} style={{ color: isActive ? item.color : undefined }} />
                                        <span>{item.name}</span>
                                        <ChevronDown size={12} className={clsx("transition-transform", immersionOpen && "rotate-180")} />
                                    </button>

                                    {/* Immersion Dropdown */}
                                    {immersionOpen && (
                                        <div
                                            className="absolute top-full left-0 mt-1 w-48 bg-white/95 backdrop-blur-xl border border-border/40 rounded-2xl shadow-xl p-2 animate-in fade-in slide-in-from-top-2 duration-200"
                                            onMouseLeave={() => setImmersionOpen(false)}
                                        >
                                            {item.children.map((child) => {
                                                const isChildActive = pathname === child.href;
                                                return (
                                                    <Link
                                                        key={child.href}
                                                        href={child.href}
                                                        className={clsx(
                                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-black tracking-wide transition-all",
                                                            isChildActive ? "bg-primary text-white shadow-md shadow-primary/20" : "text-[#A0AEC0] hover:text-[#3E4A61] hover:bg-gray-50"
                                                        )}
                                                    >
                                                        <child.icon size={14} />
                                                        <span>{child.name}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                    isActive ? "text-primary bg-primary/5" : "text-[#A0AEC0] hover:text-[#3E4A61] hover:bg-[#F7FAFC]"
                                )}
                            >
                                <item.icon size={14} style={{ color: isActive ? item.color : undefined }} />
                                <span>{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User Menu */}
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <button
                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                            className="flex items-center gap-2 p-1 pl-3 rounded-full border border-border/40 hover:border-primary/30 hover:bg-[#FFF5F7] transition-all"
                        >
                            <span className="hidden sm:block text-[10px] font-black text-[#3E4A61] uppercase tracking-wider">{displayName}</span>
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] flex items-center justify-center text-white font-black text-xs shadow-sm shadow-primary/10">
                                {displayName.slice(0, 1).toUpperCase()}
                            </div>
                        </button>

                        {/* User Dropdown */}
                        {userMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-border/40 rounded-2xl shadow-xl p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <Link
                                    href="/profile"
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-black text-[#A0AEC0] hover:text-[#3E4A61] hover:bg-gray-50 transition-all uppercase tracking-widest"
                                >
                                    <User size={14} />
                                    <span>Profile</span>
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-black text-[#A0AEC0] hover:text-red-500 hover:bg-red-50 transition-all uppercase tracking-widest"
                                >
                                    <LogOut size={14} />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-[#F7FAFC] border border-border/40 text-[#A0AEC0] hover:text-primary transition-colors"
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Drawer */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-40 top-14">
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    <div className="relative bg-white border-b border-border shadow-xl p-4 space-y-2 max-h-[80vh] overflow-y-auto animate-in slide-in-from-top-4 duration-300">
                        {NAV_ITEMS.map((item) => {
                            if (item.children) {
                                return (
                                    <div key={item.name} className="space-y-1">
                                        <div className="px-4 py-2 text-[10px] font-black text-foreground/30 uppercase tracking-widest">{item.name}</div>
                                        {item.children.map((child) => (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                className={clsx(
                                                    "flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-black transition-all",
                                                    pathname.startsWith(child.href) ? "bg-primary/5 text-primary" : "text-[#A0AEC0]"
                                                )}
                                            >
                                                <child.icon size={18} />
                                                <span>{child.name}</span>
                                            </Link>
                                        ))}
                                    </div>
                                );
                            }
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={clsx(
                                        "flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-black transition-all",
                                        pathname === item.href ? "bg-primary/5 text-primary" : "text-[#A0AEC0]"
                                    )}
                                >
                                    <item.icon size={18} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </header>
    );
}
