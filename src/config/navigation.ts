import {
    MessageCircle,
    Wrench,
    Zap,
    Library,
    BookOpen,
    CalendarDays,
    Settings,
    User,
    TrendingUp,
    LucideIcon
} from 'lucide-react';

export interface NavSection {
    id: string;
    label: string;
    href: string;
    icon: LucideIcon;
    /**
     * Paths that should trigger this section to be active.
     * Can be a prefix (string) or a Regular Expression.
     */
    matchPaths: (string | RegExp)[];
}

export const NAV_CONFIG: NavSection[] = [
    {
        id: 'chat',
        label: 'Chat',
        href: '/chat',
        icon: MessageCircle,
        matchPaths: ['/chat'],
    },
    {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: TrendingUp,
        matchPaths: ['/dashboard'],
    },
    {
        id: 'activity',
        label: 'Library',
        href: '/decks',
        icon: Library,
        matchPaths: [
            '/decks',
            '/session',
            '/result',
        ],
    },
];

export const UTILITY_CONFIG: NavSection[] = [
    {
        id: 'profile',
        label: 'Profile',
        href: '/profile',
        icon: User,
        matchPaths: ['/profile'],
    },
];

/**
 * Resolves the active section ID based on the current pathname.
 * This is the single source of truth for sidebar state.
 * 
 * Why simple prefix matching is insufficient:
 * 1. Conceptual Hierarchy: Some routes (/jlpt) belong to a section (/practice) 
 *    but don't share its URL prefix.
 * 2. Flat Routes: Complex applications often have flat URL structures that 
 *    don't reflect logical groupings.
 */
export function resolveActiveSectionId(pathname: string | null): string | null {
    if (!pathname) return null;

    // Check main navigation sections
    for (const section of NAV_CONFIG) {
        for (const pattern of section.matchPaths) {
            if (typeof pattern === 'string') {
                if (pathname.startsWith(pattern)) return section.id;
            } else {
                if (pattern.test(pathname)) return section.id;
            }
        }
    }

    // Check utility sections (Settings, Profile)
    for (const section of UTILITY_CONFIG) {
        for (const pattern of section.matchPaths) {
            if (typeof pattern === 'string') {
                if (pathname.startsWith(pattern)) return section.id;
            } else {
                if (pattern.test(pathname)) return section.id;
            }
        }
    }

    return null;
}
