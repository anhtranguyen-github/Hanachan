'use client';

import Link from 'next/link';
import React from 'react';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Swords,
    BookOpen,
    Languages,
    MessageSquare,
    LogOut,
    TrendingUp,
    X
} from 'lucide-react';

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(pathname === '/demo-v2/chat');

    React.useEffect(() => {
        setIsSidebarCollapsed(pathname === '/demo-v2/chat');
    }, [pathname]);

    const mainNavItems = [
        { name: 'Dashboard', href: '/demo-v2/dashboard', icon: <LayoutDashboard size={20} /> },
        { name: 'Training', href: '/demo-v2/learn', icon: <BookOpen size={20} /> },
        { name: 'Review', href: '/demo-v2/review', icon: <Swords size={20} /> },
        { name: 'Chatbot', href: '/demo-v2/chat', icon: <MessageSquare size={20} /> },
        { name: 'Curriculum', href: '/demo-v2/content', icon: <BookOpen size={20} /> },
        { name: 'Progress', href: '/demo-v2/progress', icon: <TrendingUp size={20} /> },
    ];

    // Check if the current route is a "Session", Dashboard or Entry page that should be an overlay (no sidebar)
    const isOverlay = pathname.startsWith('/demo-v2/review') ||
        pathname.startsWith('/demo-v2/learn');

    const closeOverlayHref = pathname === '/demo-v2/dashboard' ? '/demo-v2' : '/demo-v2/dashboard';

    return (
        <div className="flex h-screen bg-[#FFFDFD] overflow-hidden font-sans relative">
            {/* Shared Sidebar - Hidden in Overlay Modes */}
            {!isOverlay && (
                <aside
                    className={`border-r border-[#F0E0E0] flex flex-col overflow-hidden bg-white shrink-0 transition-all duration-500 ease-in-out relative z-40 ${isSidebarCollapsed ? 'w-20' : 'w-64'
                        }`}
                >
                    <div className={`p-6 mb-4 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
                        <div className="w-10 h-10 bg-[#FFB5B5] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-xl shadow-[#FFB5B5]/20 shrink-0">花</div>
                        {!isSidebarCollapsed && (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                                <h1 className="text-[13px] font-black tracking-widest text-[#3E4A61] leading-none uppercase">HANACHAN</h1>
                                <p className="text-[9px] text-[#A0AEC0] font-black uppercase tracking-tighter">Master Japanese</p>
                            </div>
                        )}
                    </div>

                    <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar pt-4">
                        {/* Main Nav */}
                        <div className="space-y-1.5">
                            {mainNavItems.map((item) => {
                                const isActive = pathname.startsWith(item.href);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        title={isSidebarCollapsed ? item.name : ''}
                                        className={`flex items-center gap-4 px-4 py-3.5 text-[13px] font-black transition-all rounded-[20px] relative group ${isActive
                                            ? 'bg-[#FFF5F5] text-[#FFB5B5]'
                                            : 'text-[#A0AEC0] hover:text-[#3E4A61] hover:bg-[#F7FAFC]'
                                            }`}
                                    >
                                        <span className={`${isActive ? 'text-[#FFB5B5]' : 'text-[#A0AEC0] group-hover:text-[#3E4A61]'}`}>
                                            {item.icon}
                                        </span>
                                        {!isSidebarCollapsed && <span className="animate-in fade-in duration-500">{item.name}</span>}
                                        {isActive && !isSidebarCollapsed && (
                                            <div className="absolute right-4 w-1.5 h-1.5 bg-[#FFB5B5] rounded-full shadow-[0_0_8px_rgba(255,181,181,0.8)]" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                    </nav>

                    <div className="p-4 border-t border-[#F7FAFC]">
                        <button className={`w-full flex items-center gap-4 px-4 py-3 text-xs font-black text-[#A0AEC0] hover:text-[#FF6B6B] transition-colors rounded-2xl ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                            <LogOut size={20} />
                            {!isSidebarCollapsed && <span>SIGN OUT</span>}
                        </button>
                    </div>
                </aside>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Regular Header (Only shown when not overlay) */}
                {!isOverlay && pathname !== '/demo-v2/chat' && (
                    <header className="h-20 border-b border-[#F0E0E0] bg-white/80 backdrop-blur-md flex items-center justify-between px-12 shrink-0 z-30">
                        <div className="flex items-center gap-4">
                            <div className="w-1.5 h-1.5 bg-[#FFB5B5] rounded-full animate-pulse" />
                            <h2 className="text-2xl font-black text-[#3E4A61] tracking-tighter capitalize">
                                {pathname.split('/').pop()?.replace('-', ' ') || 'Overview'}
                            </h2>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-[#A0AEC0] uppercase tracking-widest">Level 2</span>
                                <span className="text-[11px] font-black text-[#3E4A61]">HANAKO</span>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-[#FFF5F5] border-2 border-[#FFDADA] flex items-center justify-center text-[12px] font-black text-[#FFB5B5] shadow-sm">H</div>
                        </div>
                    </header>
                )}

                <main className={`flex-1 overflow-auto custom-scrollbar relative ${isOverlay ? 'z-50' : 'p-8 lg:p-12 bg-[#FFFDFD]'}`}>
                    {children}

                    {/* Overlay Close Button ("X") */}
                    {isOverlay && (
                        <Link
                            href={closeOverlayHref}
                            className="fixed top-8 right-8 z-[60] w-14 h-14 bg-white border-2 border-[#F0E0E0] rounded-2xl flex items-center justify-center text-[#3E4A61] hover:text-[#FF6B6B] hover:border-[#FFB5B5] transition-all shadow-xl group animate-in fade-in zoom-in duration-500 delay-300"
                        >
                            <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
                        </Link>
                    )}
                </main>
            </div>
        </div>
    );
}

// Helper icons imported above
