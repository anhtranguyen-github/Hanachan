import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/features/auth/AuthContext';

export function useLibrary(filters: { type?: string; level?: number | 'all'; query?: string }) {
    const { user } = useUser();
    const [items, setItems] = useState<any[]>([]);
    const [states, setStates] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadLibrary = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const userId = user?.id;
            let query = supabase.from('knowledge_units').select('*');
            
            if (filters.level && filters.level !== 'all') {
                query = query.eq('level', filters.level);
            }
            if (filters.type && filters.type !== 'all') {
                query = query.eq('type', filters.type);
            }

            const { data, error: fetchError } = await query
                .order('level', { ascending: true })
                .order('type', { ascending: true })
                .limit(300);

            if (fetchError) throw fetchError;

            if (userId) {
                const { data: userStates } = await supabase
                    .from('user_fsrs_states')
                    .select('*')
                    .eq('user_id', userId);
                
                const stateMap: Record<string, any> = {};
                userStates?.forEach((s: any) => { stateMap[s.ku_id] = s; });
                setStates(stateMap);
            }

            setItems(data || []);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch library data');
        } finally {
            setLoading(false);
        }
    }, [user, filters.type, filters.level]);

    useEffect(() => {
        loadLibrary();
    }, [loadLibrary]);

    const filteredItems = useMemo(() => {
        if (!filters.query) return items;
        const q = filters.query.toLowerCase();
        return items.filter(u => 
            u.meaning.toLowerCase().includes(q) || 
            u.character?.includes(q) || 
            u.slug.toLowerCase().includes(q)
        );
    }, [items, filters.query]);

    return {
        items: filteredItems,
        states,
        loading,
        error,
        refresh: loadLibrary
    };
}
