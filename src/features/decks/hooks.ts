import { useState, useEffect, useCallback } from 'react';
import { listDecksAction, toggleDeckAction, createDeckAction } from '@/features/decks/actions';
import { Deck } from './types';

export function useDecks() {
    const [decks, setDecks] = useState<Deck[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDecks = useCallback(async () => {
        setLoading(true);
        const res = await listDecksAction();
        if (res.success) {
            setDecks(res.data as Deck[]);
            setError(null);
        } else {
            setError(res.error || 'Failed to load decks');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadDecks();
    }, [loadDecks]);

    const toggleDeck = async (deckId: string, enabled: boolean) => {
        const res = await toggleDeckAction(deckId, enabled);
        if (res.success) {
            setDecks(prev => prev.map(d => d.id === deckId ? { ...d, is_enabled: enabled } : d));
            return true;
        }
        return false;
    };

    const createDeck = async (name: string, description: string) => {
        const res = await createDeckAction(name, description);
        if (res.success) {
            await loadDecks();
            return res.data;
        }
        return null;
    };

    return {
        decks,
        loading,
        error,
        refresh: loadDecks,
        toggleDeck,
        createDeck
    };
}
