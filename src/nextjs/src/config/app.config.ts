import {
    MessageCircle,
    Wrench,
    Zap,
    Library,
    BookOpen,
    CalendarDays,
    Settings,
    User,
    LucideIcon,
    Search,
    Repeat,
    Languages,
    Brain,
    FileText
} from 'lucide-react';

/**
 * UNIFIED APP CONFIGURATION
 * Centralizes all themes, navigation, and component settings.
 */

// 1. THEME CONFIGURATION
export const THEME = {
    palette: {
        sakura: {
            background: '27 82% 96%',       /* #FDF2E9 - Creamy Peach */
            foreground: '26 30% 22%',        /* #4A3728 - Deep Cocoa Brown */
            card: '27 82% 99%',               /* Very Light Cream Tint */
            primary: '346 82% 65%',          /* Sakura Pink */
            secondary: '27 40% 92%',         /* #F5EAE0 - Warmer Secondary */
            muted: '18 25% 90%',             /* #F0E5E0 - Soft Tan */
            accent: '189 57% 81%',           /* #B2E3EB - Sky Aqua Accent */
            border: '26 20% 85%',            /* #E5DCD4 - Soft Cocoa Border */
            ring: '346 82% 85%',
        },
        brand: {
            sakuraPink: '#F9B7C7',
            skyBlue: '#B2E3EB',
            leafGreen: '#ECFAF2',
            bananaYellow: '#FFF2CC',
            lavender: '#F2EBFB',
            toriiRed: '#F2A1A1',
            inkGray: '#4A3728',
        },
        neutral: {
            white: '#FFFFFF',
            cream: '#FDF2E9',
            ink: '#4A3728',
            night: '#261F1A',
        },
        // Semantic Palettes inspired by stickers
        earth: {
            primary: '46 96% 90%',           /* Banana Yellow Tint */
            foreground: '46 60% 30%',
        },
        knowledge: {
            primary: '189 57% 92%',          /* Sky Aqua Tint */
            foreground: '189 40% 30%',
        },
        growth: {
            primary: '149 40% 92%',          /* Matcha Green Tint */
            foreground: '149 25% 30%',
        },
        focus: {
            primary: '266 40% 92%',          /* Lavender Tint */
            foreground: '266 25% 35%',
        },
        sunset: {
            primary: '46 96% 81%',           /* Banana Yellow */
            foreground: '46 70% 30%',
        },
        ocean: {
            primary: '189 57% 81%',          /* Sky Aqua */
            foreground: '189 50% 30%',
        },
        forest: {
            primary: '149 40% 83%',          /* Matcha Green */
            foreground: '149 30% 30%',
        },
        crimson: {
            primary: '0 75% 88%',            /* Soft Crimson */
            foreground: '0 50% 35%',
        },
        lavender: {
            primary: '266 40% 84%',          /* Lavender */
            foreground: '266 30% 35%',
        },
        categories: {
            kanji: '46 96% 90%',
            grammar: '189 57% 92%',
            vocab: '266 40% 92%',
            reading: '0 0% 100%',
        }
    },
    typography: {
        fonts: {
            sans: 'var(--font-nunito)',
            display: 'var(--font-fredoka)',
            jp: 'var(--font-m-plus-rounded)',
        }
    },
    layout: {
        sidebarWidth: '280px',
        sidebarCollapsedWidth: '80px',
        headerHeight: '72px',
    },
    radius: {
        default: '1rem',
        large: '2rem',
        xl: '3rem',
    }
};

// 2. NAVIGATION CONFIGURATION
export interface NavSection {
    id: string;
    label: string;
    href: string;
    icon: LucideIcon;
    matchPaths: (string | RegExp)[];
}

export const NAV_CONFIG: NavSection[] = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: User, matchPaths: ['/dashboard'] },
    { id: 'study-plan', label: 'Learn', href: '/learn', icon: CalendarDays, matchPaths: ['/learn', '/study-plan'] },
    { id: 'review', label: 'Review', href: '/review', icon: Repeat, matchPaths: ['/review'] },
    { id: 'chat', label: 'AI Assistant', href: '/chat', icon: MessageCircle, matchPaths: ['/chat'] },
    { id: 'kanji', label: 'Knowledge Base', href: '/knowledge-base', icon: Library, matchPaths: ['/kanji', '/vocabulary', '/grammar', '/knowledge-base'] },
];

export const UTILITY_NAV: NavSection[] = [
    { id: 'profile', label: 'Profile', href: '/profile', icon: User, matchPaths: ['/profile'] },
];

// 3. COMPONENT CONFIGURATIONS
export const SIDEBAR_THEMES: Record<string, { bg: string, text: string, border: string }> = {
    chat: { bg: 'bg-focus', text: 'text-focus-foreground', border: 'border-border' },
    activity: { bg: 'bg-forest', text: 'text-forest-foreground', border: 'border-border' },
    'study-plan': { bg: 'bg-primary', text: 'text-primary-foreground', border: 'border-primary' },
    tools: { bg: 'bg-sunset', text: 'text-sunset-foreground', border: 'border-border' },
    library: { bg: 'bg-knowledge', text: 'text-knowledge-foreground', border: 'border-border' },
    search: { bg: 'bg-ocean', text: 'text-ocean-foreground', border: 'border-border' },
    default: { bg: 'bg-secondary', text: 'text-foreground', border: 'border-border' }
};

export const SIDEBAR_SETTINGS = {
    pollInterval: 5000,
    dedupingInterval: 10000,
};

// 4. UTILITIES
export function resolveActiveSectionId(pathname: string | null): string | null {
    if (!pathname) return null;
    const allNav = [...NAV_CONFIG, ...UTILITY_NAV];
    for (const section of allNav) {
        for (const pattern of section.matchPaths) {
            if (typeof pattern === 'string') {
                if (pathname.startsWith(pattern)) return section.id;
            } else if (pattern.test(pathname)) {
                return section.id;
            }
        }
    }
    return null;
}

