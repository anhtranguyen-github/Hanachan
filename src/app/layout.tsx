
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutGrid,
  Layers,
  Puzzle,
  Type,
  BookOpen,
  ScrollText,
  Youtube,
  Sparkles,
  MessageCircle,
  User,
  Bell,
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { AuthProvider, useUser } from "@/features/auth/AuthContext";
import "./globals.css";

const SidebarItem = ({ icon: Icon, label, href, isActive, activeClassName }: any) => (
  <Link
    href={href}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
      ? (activeClassName || 'nav-item-active')
      : 'nav-item'
      }`}
  >
    <Icon size={18} />
    {label}
  </Link>
);

const SectionLabel = ({ label }: { label: string }) => (
  <div className="px-4 mt-6 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
    {label}
  </div>
);

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <html lang="en">
      <body className="font-sans bg-[hsl(350,100%,99%)] text-slate-900">
        <AuthProvider>
          <div className="flex min-h-screen">

            {/* --- SIDEBAR (Fixed Mockup) --- */}
            <aside className="w-[260px] bg-white border-r border-slate-100 flex-shrink-0 flex flex-col h-screen fixed top-0 left-0 z-50">

              {/* Header */}
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-rose-400 rounded-lg flex items-center justify-center text-white font-bold text-xl">H</div>
                  <span className="font-bold text-lg tracking-tight text-slate-800">hanachan</span>
                </div>
                <button className="text-slate-300 hover:text-slate-600">
                  <ChevronLeft size={20} />
                </button>
              </div>

              {/* Scrollable Nav */}
              <div className="flex-1 overflow-y-auto px-4 pb-4 no-scrollbar">

                <SectionLabel label="Study" />
                <SidebarItem icon={LayoutGrid} label="Dashboard" href="/dashboard" isActive={pathname === '/dashboard'} />
                <SidebarItem icon={Layers} label="Decks" href="/decks" isActive={isActive('/decks') || isActive('/study')} />

                <SectionLabel label="Content" />
                <SidebarItem icon={Puzzle} label="Radicals" href="/radical" isActive={isActive('/radical')} activeClassName="bg-rose-100 text-rose-600 font-bold" />
                <SidebarItem icon={Type} label="Kanji" href="/kanji" isActive={isActive('/kanji')} activeClassName="bg-rose-100 text-rose-600 font-bold" />
                <SidebarItem icon={BookOpen} label="Vocabulary" href="/vocabulary" isActive={isActive('/vocabulary')} activeClassName="bg-rose-100 text-rose-600 font-bold" />
                <SidebarItem icon={ScrollText} label="Grammar" href="/grammar" isActive={isActive('/grammar')} activeClassName="bg-rose-100 text-rose-600 font-bold" />

                <SectionLabel label="Tools" />
                <SidebarItem icon={Youtube} label="YouTube Immersion" href="/immersion" isActive={isActive('/immersion')} />
                <SidebarItem icon={Sparkles} label="Text Analyzer" href="/analyze" isActive={isActive('/analyze')} />
                <SidebarItem icon={MessageCircle} label="Hana AI Chat" href="/chat" isActive={isActive('/chat')} />

                <SectionLabel label="Account" />
                <SidebarItem icon={User} label="Profile" href="/profile" isActive={isActive('/profile')} />

              </div>

              {/* Footer (User) */}
              <FooterSection />
            </aside>

            {/* --- MAIN CONTENT PREVIEW --- */}
            <main className="flex-1 ml-[260px] min-h-screen p-8">
              {children}
            </main>

          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

function FooterSection() {
  const { user, signOut } = useUser();
  const initial = (user?.user_metadata?.display_name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <div className="p-4 border-t border-slate-50 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-slate-100">
          <Bell size={16} />
        </button>
        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold border border-rose-200">
          {initial}
        </div>
      </div>
      <button
        onClick={() => signOut()}
        className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}
