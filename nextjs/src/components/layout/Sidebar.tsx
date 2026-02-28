'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    MessageSquare,
    LogOut,
    ChevronRight,
    TrendingUp,
    Swords,
    Library,
    Menu,
    X,
    User,
    Mic,
    BookMarked,
    Video,
    PenTool,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUser } from '@/features/auth/AuthContext';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, color: '#F4ACB7' },
    { name: 'Learn', href: '/learn', icon: BookOpen, color: '#A2D2FF' },
    { name: 'Review', href: '/review', icon: Swords, color: '#CDB4DB' },
    { name: 'Videos', href: '/videos', icon: Video, color: '#FF9F9F' },
    { name: 'Reading', href: '/reading', icon: BookMarked, color: '#7BB8F0' },
    { name: 'AI Chat', href: '/immersion/chatbot', icon: MessageSquare, color: '#B7E4C7' },
    { name: 'Speaking', href: '/immersion/speaking', icon: Mic, color: '#FFB5B5' },
    { name: 'Curriculum', href: '/content', icon: Library, color: '#FFD6A5' },
    { name: 'Sentences', href: '/sentences', icon: PenTool, color: '#A2D2FF' },
    { name: 'Profile', href: '/profile', icon: User, color: '#F4ACB7' },
];

export function Sidebar() {
    const pathname = usePathname();
    const { signOut } = useUser();
    const [isCollapsed, setIsCollapsed] = React.useState(false);
    const [mobileOpen, setMobileOpen] = React.useState(false);

    React.useEffect(() => {
        const isImmersive = pathname.includes('/chatbot') || pathname.includes('/speaking');
        if (isImmersive) setIsCollapsed(true);
        // Close mobile menu on route change
        setMobileOpen(false);
    }, [pathname]);

    return (
        <>
            {/* ===== DESKTOP SIDEBAR ===== */}
            <aside
                className={clsx(
                    "hidden lg:flex border-r border-[#F0E0E0]/60 flex-col overflow-hidden shrink-0 transition-all duration-500 ease-in-out relative z-40 sidebar-glass",
                    isCollapsed ? "w-[72px]" : "w-64"
                )}
            >
                {/* Subtle gradient overlay at top */}
                <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#FFF5F7] to-transparent pointer-events-none z-0" />

                {/* Branding */}
                <div className={clsx(
                    "px-5 h-16 flex items-center shrink-0 border-b border-[#F0E0E0]/60 relative z-10",
                    isCollapsed ? "justify-center" : "justify-start"
                )}>
                    <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-primary rounded-xl blur-md opacity-30 animate-pulse-slow" />
                            <div className="relative w-9 h-9 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg shadow-primary/30">
                                花
                            </div>
                        </div>
                        {!isCollapsed && (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                                <h1 className="text-[11px] font-black tracking-[0.2em] text-[#3E4A61] leading-none uppercase">
                                    HANACHAN
                                </h1>
                                <p className="text-[8px] font-bold text-[#CBD5E0] tracking-[0.15em] uppercase mt-0.5">
                                    Japanese Learning
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Collapse/Expand Toggle */}
                <div className={clsx("px-3 pt-2 pb-1 relative z-10", isCollapsed ? "flex justify-center" : "flex justify-end pr-5")}>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-7 h-7 bg-[#F7FAFC] hover:bg-[#FFF0F2] border border-[#F0E0E0]/80 hover:border-primary/30 rounded-lg flex items-center justify-center text-[#A0AEC0] hover:text-primary transition-all duration-300"
                        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <ChevronRight size={14} className={clsx("transition-transform duration-300", isCollapsed ? "" : "rotate-180")} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1 overflow-y-auto no-scrollbar pt-4 relative z-10">
                    {navItems.map((item, idx) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                title={isCollapsed ? item.name : ''}
                                style={{ animationDelay: `${idx * 0.05}s` }}
                                className={clsx(
                                    "flex items-center gap-3.5 px-3 py-3 text-[12px] font-black transition-all duration-300 rounded-2xl relative group overflow-hidden",
                                    isActive ? "text-[#3E4A61]" : "text-[#A0AEC0] hover:text-[#3E4A61]"
                                )}
                            >
                                {isActive && (
                                    <div
                                        className="absolute inset-0 rounded-2xl opacity-100 transition-all duration-300"
                                        style={{
                                            background: `linear-gradient(135deg, ${item.color}22, ${item.color}11)`,
                                            border: `1px solid ${item.color}33`,
                                        }}
                                    />
                                )}
                                {!isActive && (
                                    <div className="absolute inset-0 rounded-2xl bg-[#F7FAFC] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                )}
                                <span
                                    className={clsx("shrink-0 transition-all duration-300 relative z-10", isActive ? "scale-110" : "group-hover:scale-105")}
                                    style={{ color: isActive ? item.color : undefined }}
                                >
                                    <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                </span>
                                {!isCollapsed && (
                                    <span className="animate-in fade-in duration-500 truncate relative z-10 tracking-wide">
                                        {item.name}
                                    </span>
                                )}
                                {isActive && !isCollapsed && (
                                    <div
                                        className="absolute right-3 w-1.5 h-1.5 rounded-full z-10"
                                        style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}
                                    />
                                )}
                                {isActive && isCollapsed && (
                                    <div
                                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[#F0E0E0] to-transparent" />

                <div className="p-3 relative z-10">
                    <button
                        onClick={() => signOut()}
                        className={clsx(
                            "w-full flex items-center gap-3.5 px-3 py-3 text-[11px] font-black text-[#A0AEC0] hover:text-[#FF6B6B] hover:bg-red-50/50 transition-all duration-300 rounded-2xl uppercase tracking-widest group",
                            isCollapsed ? "justify-center" : ""
                        )}
                    >
                        <LogOut size={16} className="group-hover:rotate-12 transition-transform duration-300" />
                        {!isCollapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* ===== MOBILE TOP HEADER ===== */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white/90 backdrop-blur-xl border-b border-[#F0E0E0]/60 flex items-center justify-between px-4 shadow-sm">
                <div className="flex items-center gap-2.5">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary rounded-xl blur-md opacity-30" />
                        <div className="relative w-8 h-8 bg-gradient-to-br from-[#F4ACB7] to-[#D88C9A] rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md">
                            花
                        </div>
                    </div>
                    <span className="text-[11px] font-black tracking-[0.2em] text-[#3E4A61] uppercase">HANACHAN</span>
                </div>
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#F7FAFC] border border-border/40 text-[#A0AEC0] hover:text-primary transition-colors"
                >
                    {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
            </div>

            {/* ===== MOBILE DRAWER ===== */}
            {mobileOpen && (
                <div className="lg:hidden fixed inset-0 z-40" onClick={() => setMobileOpen(false)}>
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                    <div
                        className="absolute top-14 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-[#F0E0E0] shadow-xl p-4 space-y-1 animate-in slide-in-from-top-4 duration-300"
                        onClick={e => e.stopPropagation()}
                    >
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={clsx(
                                        "flex items-center gap-3 px-4 py-3 rounded-2xl text-[13px] font-black transition-all duration-200",
                                        isActive ? "text-[#3E4A61]" : "text-[#A0AEC0]"
                                    )}
                                    style={isActive ? {
                                        background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
                                        border: `1px solid ${item.color}30`,
                                    } : {}}
                                >
                                    <item.icon size={18} style={{ color: isActive ? item.color : undefined }} />
                                    <span>{item.name}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                                    )}
                                </Link>
                            );
                        })}
                        <div className="pt-2 border-t border-border/20">
                            <button
                                onClick={() => signOut()}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[12px] font-black text-[#A0AEC0] hover:text-[#FF6B6B] hover:bg-red-50/50 transition-all uppercase tracking-widest"
                            >
                                <LogOut size={16} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MOBILE BOTTOM NAV ===== */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-[#F0E0E0]/60 shadow-lg safe-area-bottom">
                <div className="flex items-center justify-around px-2 py-2">
                    {navItems.slice(0, 6).map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all duration-200 min-w-[52px]"
                                style={isActive ? {
                                    background: `linear-gradient(135deg, ${item.color}20, ${item.color}10)`,
                                } : {}}
                            >
                                <item.icon
                                    size={20}
                                    strokeWidth={isActive ? 2.5 : 1.8}
                                    style={{ color: isActive ? item.color : '#A0AEC0' }}
                                />
                                <span
                                    className="text-[9px] font-black uppercase tracking-wide"
                                    style={{ color: isActive ? item.color : '#CBD5E0' }}
                                >
                                    {item.name.slice(0, 4)}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
