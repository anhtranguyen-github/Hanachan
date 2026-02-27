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
    Search,
    TrendingUp,
    Swords
} from 'lucide-react';
import { clsx } from 'clsx';
import { useUser } from '@/features/auth/AuthContext';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Training', href: '/learn', icon: BookOpen },
    { name: 'Review', href: '/review', icon: Swords },
    { name: 'Chatbot', href: '/immersion/chatbot', icon: MessageSquare },
    { name: 'Curriculum', href: '/content', icon: BookOpen }, // Reusing BookOpen as placeholder for Library
    { name: 'Progress', href: '/progress', icon: TrendingUp },
];

export function Sidebar() {
    const pathname = usePathname();
    const { signOut } = useUser();
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    // Auto-collapse on mobile or specific routes if needed
    // For now, let's keep it manual or based on route
    React.useEffect(() => {
        const isChat = pathname.includes('/chatbot');
        if (isChat) setIsCollapsed(true);
    }, [pathname]);

    return (
        <aside
            className={clsx(
                "border-r border-[#F0E0E0] flex flex-col bg-white shrink-0 transition-all duration-500 ease-in-out relative z-40",
                isCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Branding */}
            <div className={clsx(
                "p-6 h-20 flex items-center shrink-0",
                isCollapsed ? "justify-center" : "gap-3"
            )}>
                <div className="w-10 h-10 bg-[#FFB5B5] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-[#FFB5B5]/20 shrink-0">
                    花
                </div>
                {!isCollapsed && (
                    <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                        <h1 className="text-[13px] font-black tracking-widest text-[#3E4A61] leading-none uppercase">
                            HANACHAN
                        </h1>
                        <p className="text-[9px] text-[#A0AEC0] font-black uppercase tracking-tighter">
                            Master Japanese
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar pt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={isCollapsed ? item.name : ''}
                            className={clsx(
                                "flex items-center gap-4 px-4 py-3.5 text-[13px] font-black transition-all rounded-[20px] relative group",
                                isActive
                                    ? "bg-[#FFF5F5] text-[#FFB5B5]"
                                    : "text-[#A0AEC0] hover:text-[#3E4A61] hover:bg-[#F7FAFC]"
                            )}
                        >
                            <span className={clsx(
                                "shrink-0 transition-colors",
                                isActive ? "text-[#FFB5B5]" : "text-[#A0AEC0] group-hover:text-[#3E4A61]"
                            )}>
                                <item.icon size={20} />
                            </span>
                            {!isCollapsed && (
                                <span className="animate-in fade-in duration-500 truncate">
                                    {item.name}
                                </span>
                            )}
                            {isActive && !isCollapsed && (
                                <div className="absolute right-4 w-1.5 h-1.5 bg-[#FFB5B5] rounded-full shadow-[0_0_8px_rgba(255,181,181,0.8)]" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-[#F7FAFC]">
                <button
                    onClick={() => signOut()}
                    className={clsx(
                        "w-full flex items-center gap-4 px-4 py-4 text-[11px] font-black text-[#A0AEC0] hover:text-[#FF6B6B] transition-colors rounded-2xl uppercase tracking-widest",
                        isCollapsed ? "justify-center" : ""
                    )}
                >
                    <LogOut size={20} />
                    {!isCollapsed && <span>Sign Out</span>}
                </button>
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex absolute shadow-sm -right-3 top-24 w-6 h-6 bg-white border border-[#F0E0E0] rounded-full items-center justify-center text-[#A0AEC0] hover:text-[#FFB5B5] transition-all z-50"
            >
                <ChevronRight size={14} className={clsx("transition-transform duration-300", isCollapsed ? "" : "rotate-180")} />
            </button>
        </aside>
    );
}

