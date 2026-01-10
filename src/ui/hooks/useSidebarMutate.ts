'use client';

import { useCallback } from 'react';

/**
 * Hook to manually trigger sidebar history and resources refresh
 */
export function useSidebarMutate() {
    return useCallback(() => {
        // No-op for purely UI template
    }, []);
}
