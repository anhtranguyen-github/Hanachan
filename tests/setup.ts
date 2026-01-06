
import { vi } from 'vitest';

// Mock Supabase
vi.mock('@supabase/auth-helpers-nextjs', () => ({
    createClientComponentClient: () => ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: {}, error: null }),
                    limit: () => Promise.resolve({ data: [], error: null })
                }),
                limit: () => Promise.resolve({ data: [], error: null }),
                order: () => ({
                    limit: () => Promise.resolve({ data: [], error: null })
                })
            }),
            update: () => ({
                eq: () => Promise.resolve({ error: null })
            })
        })
    })
}));
