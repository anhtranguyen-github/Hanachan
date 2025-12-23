
import { create } from 'zustand';

interface UIState {
    // Sidebar
    isSidebarOpen: boolean;
    isSidebarCollapsed: boolean;
    activeNavTab: 'app' | 'tools';

    // Theme
    activeTheme: 'sakura' | 'night';

    // Actions
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    toggleCollapse: () => void;
    setNavTab: (tab: 'app' | 'tools') => void;
    setTheme: (theme: 'sakura' | 'night') => void;

    // Global App State (Simple)
    isLoaded: boolean;
    setLoaded: (loaded: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
    isSidebarOpen: true,
    isSidebarCollapsed: false,
    activeNavTab: 'app',
    activeTheme: 'sakura',
    isLoaded: false,

    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    setSidebarOpen: (open) => set({ isSidebarOpen: open }),
    toggleCollapse: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
    setNavTab: (tab) => set({ activeNavTab: tab }),
    setTheme: (theme) => set({ activeTheme: theme }),
    setLoaded: (loaded) => set({ isLoaded: loaded }),
}));
