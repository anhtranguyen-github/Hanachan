"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    History,
    PlusCircle,
    Zap,
    BookmarkPlus,
    TrendingUp,
    BarChart2,
    GraduationCap,
    User as UserIcon,
    Settings,
    ChevronLeft,
    ChevronRight,
    Lock,
    LogIn,
    Bell,
    LogOut,
    Blocks,
    Languages,
    BookOpen,
    ScrollText,
    Sparkles,
    Youtube,
    MessageCircle,
    MessageCircle,
    LucideIcon,
    GraduationCap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/lib/ui/dropdown-menu';
import { useSidebar } from './SidebarContext';
import { useUser } from '@/modules/auth/AuthContext';
import { cn } from '@/lib/utils';


interface SidebarItem {
    id: string;
    label: string;
    icon: LucideIcon;
    route: string;
    badgeCount?: number;
    disabled?: boolean;
}

interface SidebarSection {
    id: string;
    label: string;
    items: SidebarItem[];
}

export const SakuraSidebar = React.memo(function SakuraSidebar() {
    const { isExpanded, toggle } = useSidebar();
    const [dueCount, setDueCount] = React.useState(0);
    const { user, logout } = useUser();
    const pathname = usePathname();
    const router = useRouter();

    React.useEffect(() => {
        if (!user) return;
        const fetchDue = async () => {
            const res = await fetch('/api/study/due-count');
            const data = await res.json();
            setDueCount(data.count);
        };
        fetchDue();
    }, [user, pathname]);

    if (pathname?.startsWith('/auth/')) {
        return null;
    }

    const isGuest = !user;

    const activeSections = React.useMemo(() => {
        const appSections: SidebarSection[] = [
            {
                id: 'study',
                label: 'Study',
                items: [
                    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp, route: '/dashboard' },
                    { id: 'study', label: 'Daily Review', icon: GraduationCap, route: '/study/review', badgeCount: dueCount },
                    { id: 'decks', label: 'Matrix', icon: BookmarkPlus, route: '/decks' },
                ]
            }
        ];

        const contentSection: SidebarSection = {
            id: 'content',
            label: 'Content',
            items: [
                { id: 'radicals', label: 'Radicals', icon: Blocks, route: '/radicals' },
                { id: 'kanji', label: 'Kanji', icon: Languages, route: '/kanji' },
                { id: 'vocabulary', label: 'Vocabulary', icon: BookOpen, route: '/vocabulary' },
                { id: 'grammar', label: 'Grammar', icon: ScrollText, route: '/grammar' },
            ]
        };

        const toolsSection: SidebarSection = {
            id: 'tools',
            label: 'Tools',
            items: [
                { id: 'youtube', label: 'YouTube Immersion', icon: Youtube, route: '/immersion?type=youtube' },
                { id: 'analyzer', label: 'Text Analyzer', icon: Sparkles, route: '/analyzer' },
                { id: 'chat', label: 'Hana AI Chat', icon: MessageCircle, route: '/chat' },
            ]
        };

        return [...appSections, contentSection, toolsSection];
    }, []);

    const utilityItems: SidebarItem[] = React.useMemo(() => {
        return [
            ...(user?.role === 'ADMIN' ? [
                { id: 'admin', label: 'Admin Portal', icon: Lock, route: '/admin' }
            ] : []),
            ...(isGuest ? [
                { id: 'signin', label: 'Sign In', icon: LogIn, route: '/auth/signin' }
            ] : [
                { id: 'profile', label: 'Profile', icon: UserIcon, route: '/profile' },
            ]),
        ];
    }, [isGuest, user?.role]);

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-sakura-bg-surface border-r border-sakura-divider transition-all duration-300 ease-in-out ",
                isExpanded ? "w-60" : "w-16"
            )}
        >
            {/* Top Toggle & Logo Section */}
            <div className={cn(
                "flex flex-col border-b border-sakura-divider shrink-0 bg-sakura-bg-soft/20",
                !isExpanded && "items-center"
            )}>
                <div className={cn(
                    "h-16 flex items-center px-4",
                    isExpanded ? "justify-between" : "justify-center"
                )}>
                    <Link href="/decks" className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 rounded-lg bg-sakura-accent-primary flex items-center justify-center shrink-0">
                            <span className="text-white font-bold text-lg">H</span>
                        </div>
                        {isExpanded && (
                            <span className="font-fredoka font-bold text-lg text-sakura-text-primary truncate tracking-tight">hanachan</span>
                        )}
                    </Link>

                    {isExpanded && (
                        <button
                            onClick={toggle}
                            className="p-1.5 rounded-lg hover:bg-sakura-bg-soft text-sakura-text-muted hover:text-sakura-accent-primary transition-all"
                            title="Collapse Sidebar"
                            aria-label="Collapse Sidebar"
                        >
                            <ChevronLeft size={18} aria-hidden="true" />
                        </button>
                    )}
                </div>

                {!isExpanded && (
                    <button
                        onClick={toggle}
                        className="w-full h-10 flex items-center justify-center hover:bg-sakura-bg-soft text-sakura-text-muted hover:text-sakura-accent-primary transition-all border-t border-sakura-divider/50"
                        title="Expand Sidebar"
                        aria-label="Expand Sidebar"
                    >
                        <ChevronRight size={18} aria-hidden="true" />
                    </button>
                )}
            </div>


            {/* Navigation Sections */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar">
                {activeSections.map((section) => (
                    <div key={section.id} className="mb-4 px-3">
                        {isExpanded && (
                            <h3 className="text-[10px] font-bold text-sakura-text-muted uppercase tracking-widest px-3 mb-2">
                                {section.label}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const isActive = pathname === item.route || (item.route !== '/' && pathname?.startsWith(item.route + '/'));
                                const Icon = item.icon;

                                // Content type & Section specific colors for active AND hover states
                                const getColorScheme = () => {
                                    if (section.id === 'content') {
                                        switch (item.id) {
                                            case 'radicals': return {
                                                activeBg: 'bg-blue-50', activeText: 'text-blue-700', activeBorder: 'border-l-4 border-blue-500',
                                                hoverBg: 'hover:bg-blue-50/60', hoverText: 'hover:text-blue-600', hoverBorder: 'hover:border-l-4 hover:border-blue-300',
                                                iconColor: 'text-blue-600'
                                            };
                                            case 'kanji': return {
                                                activeBg: 'bg-pink-50', activeText: 'text-pink-700', activeBorder: 'border-l-4 border-pink-500',
                                                hoverBg: 'hover:bg-pink-50/60', hoverText: 'hover:text-pink-600', hoverBorder: 'hover:border-l-4 hover:border-pink-300',
                                                iconColor: 'text-pink-600'
                                            };
                                            case 'vocabulary': return {
                                                activeBg: 'bg-purple-50', activeText: 'text-purple-700', activeBorder: 'border-l-4 border-purple-500',
                                                hoverBg: 'hover:bg-purple-50/60', hoverText: 'hover:text-purple-600', hoverBorder: 'hover:border-l-4 hover:border-purple-300',
                                                iconColor: 'text-purple-600'
                                            };
                                            case 'grammar': return {
                                                activeBg: 'bg-red-50', activeText: 'text-red-700', activeBorder: 'border-l-4 border-red-500',
                                                hoverBg: 'hover:bg-red-50/60', hoverText: 'hover:text-red-600', hoverBorder: 'hover:border-l-4 hover:border-red-300',
                                                iconColor: 'text-red-600'
                                            };
                                        }
                                    }
                                    if (section.id === 'tools') {
                                        switch (item.id) {
                                            case 'youtube': return {
                                                activeBg: 'bg-red-50', activeText: 'text-red-700', activeBorder: 'border-l-4 border-red-500',
                                                hoverBg: 'hover:bg-red-50/60', hoverText: 'hover:text-red-600', hoverBorder: 'hover:border-l-4 hover:border-red-300',
                                                iconColor: 'text-red-600'
                                            };
                                            case 'analyzer': return {
                                                activeBg: 'bg-violet-50', activeText: 'text-violet-700', activeBorder: 'border-l-4 border-violet-500',
                                                hoverBg: 'hover:bg-violet-50/60', hoverText: 'hover:text-violet-600', hoverBorder: 'hover:border-l-4 hover:border-violet-300',
                                                iconColor: 'text-violet-600'
                                            };
                                            case 'chat': return {
                                                activeBg: 'bg-indigo-50', activeText: 'text-indigo-700', activeBorder: 'border-l-4 border-indigo-500',
                                                hoverBg: 'hover:bg-indigo-50/60', hoverText: 'hover:text-indigo-600', hoverBorder: 'hover:border-l-4 hover:border-indigo-300',
                                                iconColor: 'text-indigo-600'
                                            };
                                        }
                                    }
                                    if (section.id === 'study') {
                                        switch (item.id) {
                                            case 'dashboard': return {
                                                activeBg: 'bg-cyan-50', activeText: 'text-cyan-700', activeBorder: 'border-l-4 border-cyan-500',
                                                hoverBg: 'hover:bg-cyan-50/60', hoverText: 'hover:text-cyan-600', hoverBorder: 'hover:border-l-4 hover:border-cyan-300',
                                                iconColor: 'text-cyan-600'
                                            };
                                            case 'decks': return {
                                                activeBg: 'bg-rose-50', activeText: 'text-rose-700', activeBorder: 'border-l-4 border-rose-500',
                                                hoverBg: 'hover:bg-rose-50/60', hoverText: 'hover:text-rose-600', hoverBorder: 'hover:border-l-4 hover:border-rose-300',
                                                iconColor: 'text-rose-600'
                                            };
                                        }
                                    }
                                    // Default: Sakura brand
                                    return {
                                        activeBg: 'bg-sakura-accent-muted', activeText: 'text-sakura-accent-primary', activeBorder: 'border-l-4 border-sakura-accent-primary',
                                        hoverBg: 'hover:bg-sakura-bg-soft', hoverText: 'hover:text-sakura-accent-primary', hoverBorder: 'hover:border-l-4 hover:border-sakura-cocoa/30',
                                        iconColor: 'text-sakura-accent-primary'
                                    };
                                };

                                const colorScheme = getColorScheme();

                                return (
                                    <Link
                                        key={item.id}
                                        href={item.disabled ? '#' : item.route}
                                        onClick={(e) => {
                                            if (item.disabled) {
                                                e.preventDefault();
                                            }
                                        }}
                                        className={cn(
                                            "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ease-out relative border-l-4 border-transparent",
                                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                            isActive
                                                ? `${colorScheme.activeBg} ${colorScheme.activeText} ${colorScheme.activeBorder}`
                                                : `text-sakura-text-secondary ${colorScheme.hoverBg} ${colorScheme.hoverText} ${colorScheme.hoverBorder}`,
                                            item.disabled && "opacity-50 cursor-not-allowed"
                                        )}
                                        title={!isExpanded ? item.label : undefined}
                                    >
                                        <div className="relative">
                                            <Icon
                                                size={20}
                                                aria-hidden="true"
                                                className={cn(
                                                    "shrink-0 transition-all duration-200",
                                                    isActive ? colorScheme.iconColor : `text-sakura-text-muted group-hover:${colorScheme.iconColor} group-hover:scale-110`
                                                )}
                                            />
                                            {item.disabled && (
                                                <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 border border-sakura-divider">
                                                    <Lock size={8} className="text-sakura-text-muted" aria-hidden="true" />
                                                </div>
                                            )}
                                        </div>

                                        {isExpanded && (
                                            <div className="flex items-center justify-between flex-1 min-w-0">
                                                <span className="text-sm truncate font-semibold">
                                                    {item.label}
                                                </span>
                                                {item.disabled && <Lock size={12} className="text-sakura-text-muted ml-2" />}
                                            </div>
                                        )}

                                        <span className={cn(
                                            "absolute right-2 flex items-center justify-center h-5 min-w-[20px] px-1 bg-sakura-accent-primary text-white text-[10px] font-bold rounded-full",
                                            !isExpanded && "top-0 -right-1"
                                        )}>
                                            <span className="sr-only">Notifications: </span>
                                            {item.badgeCount}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Always show utility at the bottom of the list */}
                <div className="mt-8 px-3">
                    {isExpanded && (
                        <h3 className="text-[10px] font-bold text-sakura-text-muted uppercase tracking-widest px-3 mb-2">
                            Account
                        </h3>
                    )}
                    <div className="space-y-1">
                        {utilityItems.map((item) => {
                            const isActive = pathname === item.route || (item.route !== '/' && pathname?.startsWith(item.route + '/'));
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.id}
                                    href={item.disabled ? '#' : item.route}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-xl transition-all group relative",
                                        isActive
                                            ? "bg-sakura-accent-muted text-sakura-accent-primary"
                                            : "text-sakura-text-secondary hover:bg-sakura-bg-soft font-medium",
                                        item.disabled && "opacity-50 cursor-not-allowed"
                                    )}
                                    title={!isExpanded ? item.label : undefined}
                                >
                                    <div className="relative">
                                        <Icon size={20} aria-hidden="true" className={cn("shrink-0", isActive ? "text-sakura-accent-primary" : "text-sakura-text-muted group-hover:text-sakura-text-primary")} />
                                        {item.disabled && (
                                            <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 border border-sakura-divider">
                                                <Lock size={8} className="text-sakura-text-muted" aria-hidden="true" />
                                            </div>
                                        )}
                                    </div>
                                    {isExpanded && (
                                        <div className="flex items-center justify-between flex-1 min-w-0">
                                            <span className="text-sm truncate">{item.label}</span>
                                            {item.disabled && <Lock size={12} className="text-sakura-text-muted ml-2" />}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Compact Footer Icons */}
            <div className={cn(
                "mt-auto border-t border-sakura-divider p-3 flex gap-2",
                isExpanded ? "flex-row items-center justify-between" : "flex-col items-center"
            )}>
                {/* Study Health */}


                {/* Notifications */}
                <button
                    className="relative p-2 rounded-xl bg-sakura-bg-soft border border-sakura-divider hover:bg-sakura-accent-muted transition-colors text-sakura-text-muted hover:text-sakura-accent-primary"
                    title="Notifications"
                >
                    <Bell size={18} aria-hidden="true" />
                    {studyStats.reviewsCount > 0 && (
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white">
                            <span className="sr-only">New reviews available</span>
                        </span>
                    )}
                </button>

                {/* Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded-full bg-sakura-bg-soft border border-sakura-divider hover:border-sakura-accent-primary transition-all outline-none" aria-label="User Menu">
                            <div className="w-8 h-8 rounded-full bg-sakura-accent-muted flex items-center justify-center border border-sakura-divider shrink-0 overflow-hidden">
                                <UserIcon size={18} className="text-sakura-accent-primary" />
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isExpanded ? "start" : "end"} side="right" sideOffset={12} className="w-56 bg-white border border-sakura-divider rounded-2xl p-2 mb-2  animate-in fade-in zoom-in-95 duration-200">
                        <DropdownMenuLabel className="px-3 py-2">
                            <div className="flex flex-col">
                                <span className="font-bold text-sm text-sakura-text-primary truncate">{user?.name || "Guest Student"}</span>
                                <span className="text-[10px] text-sakura-text-muted truncate capitalize">{user?.role?.toLowerCase() || "Member"}</span>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-sakura-divider my-1" />
                        <DropdownMenuItem className="focus:bg-sakura-bg-soft rounded-xl cursor-pointer py-2.5 px-3 text-sm text-sakura-text-secondary" onClick={() => router.push('/profile')}>
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>My Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="focus:bg-sakura-bg-soft rounded-xl cursor-pointer py-2.5 px-3 text-sm text-sakura-text-secondary" onClick={() => router.push('/dashboard')}>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            <span>Detailed Progress</span>
                        </DropdownMenuItem>
                        {!isGuest && (
                            <>
                                <DropdownMenuSeparator className="bg-sakura-divider my-1" />
                                <DropdownMenuItem
                                    className="focus:bg-destructive/10 rounded-xl cursor-pointer py-2.5 px-3 text-sm text-destructive"
                                    onClick={async () => {
                                        await logout();
                                        router.push('/auth/signin');
                                        router.refresh();
                                    }}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sign Out</span>
                                </DropdownMenuItem>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Auth Button */}
                <button
                    onClick={async () => {
                        if (isGuest) {
                            router.push('/auth/signin');
                        } else {
                            await logout();
                            router.push('/auth/signin');
                            router.refresh();
                        }
                    }}
                    className={cn(
                        "p-2 rounded-xl bg-sakura-bg-soft border border-sakura-divider transition-all",
                        isGuest ? "text-sakura-accent-primary hover:bg-sakura-accent-muted" : "text-destructive hover:bg-destructive/10 hover:border-destructive/30"
                    )}
                    title={isGuest ? "Sign In" : "Sign Out"}
                >
                    {isGuest ? <LogIn size={18} /> : <LogOut size={18} />}
                </button>
            </div>
        </aside>
    );
});
