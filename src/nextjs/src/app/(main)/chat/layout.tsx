'use client';

import React, { useState, useEffect } from 'react';
import { ChatProvider } from '@/features/chat/context/ChatContext';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { Menu, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';

export default function ChatLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        // Auto-collapse on small screens
        const handleResize = () => {
            if (window.innerWidth < 1024) setSidebarOpen(false);
            else setSidebarOpen(true);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <ChatProvider>
            <div className="flex flex-1 h-full min-h-0 overflow-hidden bg-white relative">
                {/* Overlay backdrop for mobile when sidebar is open */}
                {sidebarOpen && (
                    <div
                        className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-[2px] z-20 animate-in fade-in duration-300"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Chat Sidebar */}
                <ChatSidebar
                    isOpen={sidebarOpen}
                    onToggle={() => setSidebarOpen(!sidebarOpen)}
                />

                {/* Main Chat Canvas */}
                <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
                    {/* Toggle button for when sidebar is closed */}
                    {!sidebarOpen && (
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="absolute top-4 left-4 z-40 p-2.5 bg-white border border-[#F0E0E0] rounded-xl text-[#A0AEC0] hover:text-primary transition-all shadow-sm hover:shadow-md active:scale-95"
                            title="Open history"
                        >
                            <MessageSquare size={18} />
                        </button>
                    )}

                    {children}
                </div>
            </div>
        </ChatProvider>
    );
}
