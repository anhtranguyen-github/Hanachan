'use client';

import Link from 'next/link';
import React from 'react';
import { usePathname } from 'next/navigation';

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Define main navigation for the "Real App" experience
    const mainNavItems = [
        { name: 'Dashboard', href: '/demo-v2/dashboard', icon: '🏠' },
        { name: 'Learn', href: '/demo-v2/learn', icon: '📖' },
        { name: 'Review', href: '/demo-v2/review', icon: '🔁' },
        { name: 'Contents', href: '/demo-v2/content', icon: '📚' },
        { name: 'Progress', href: '/demo-v2/progress', icon: '📈' },
        { name: 'Chatbot', href: '/demo-v2/chat', icon: '💬' },
    ];

    // Sidebar items specifically for " Navigation" (hidden or moved to keep it clean)
    const NavItems = [
        { name: 'Landing Page', href: '/demo-v2' },
        { name: 'Review Sections', href: '/demo-v2/learn/section' },
        { name: 'Grammar Cloze', href: '/demo-v2/review/cloze' },
    ];

    // Determine if we are in a "Session" (Learn or Review flow)
    const isSession = pathname.includes('/lesson-batch') ||
        pathname.includes('/review/item') ||
        pathname.includes('/review/batch') ||
        pathname.includes('/review/cloze') ||
        pathname.includes('/review/complete') ||
        pathname.includes('/learn/complete') ||
        pathname.includes('/learn/quit');

    return (
        <div className="flex h-screen bg-white">
            {/* Sidebar - Hidden in sessions for focus */}
            {!isSession && (
                <aside className="w-64 border-r-4 border-gray-200 flex flex-col overflow-hidden bg-white shrink-0">
                    <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-black">H</div>
                        <h1 className="text-xl font-black text-gray-800 tracking-tighter">hanachan</h1>
                    </div>

                    <nav className="flex-1 overflow-y-auto p-4 space-y-8 mt-4">
                        <div>
                            <ul className="space-y-1">
                                {mainNavItems.map((item) => {
                                    const isActive = pathname === item.href || (item.href !== '/demo-v2/dashboard' && pathname.startsWith(item.href));
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-2xl transition-all ${isActive
                                                    ? 'bg-primary/10 text-primary shadow-sm'
                                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                                    }`}
                                            >
                                                <span className="text-lg">{item.icon}</span>
                                                {item.name}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        {/* Utilities - hidden by default */}
                        <div className="pt-4 border-t-2 border-gray-200 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 mb-3 px-4">Utilities</h3>
                            <ul className="space-y-1">
                                {NavItems.map((item) => (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className="block px-4 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </nav>

                    <div className="p-4 border-t-2 border-gray-200">
                        <div className="p-4 bg-gray-50 rounded-2xl flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                            <div className="overflow-hidden">
                                <p className="text-xs font-black text-gray-800 truncate">Hana Traveler</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase truncate">Level 12</p>
                            </div>
                        </div>
                    </div>
                </aside>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header - Hidden in sessions */}
                {!isSession && (
                    <header className="h-20 border-b-4 border-gray-200 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 shrink-0 sticky top-0 z-30">
                        <div className="flex flex-col">
                            <h2 className="text-lg font-black text-gray-800 capitalize">
                                {pathname.split('/').pop()?.replace('-', ' ') || 'Overview'}
                            </h2>
                        </div>

                        <div className="flex items-center gap-4">
                            <button className="px-6 py-2.5 bg-primary text-white text-sm font-black rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                                Study Now
                            </button>
                        </div>
                    </header>
                )}

                {/* Page Area */}
                <main className={`flex-1 overflow-auto ${isSession ? '' : 'p-8'}`}>
                    {children}
                </main>

                {/* Hidden Exit - Only for dev use */}
                {isSession && (
                    <div className="fixed bottom-4 left-4 z-50 opacity-0 hover:opacity-100 transition-opacity">
                        <Link
                            href="/demo-v2/dashboard"
                            className="bg-gray-900/10 backdrop-blur-sm px-4 py-2 rounded-full text-[10px] font-black text-white/50 uppercase tracking-widest"
                        >
                            Exit
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
