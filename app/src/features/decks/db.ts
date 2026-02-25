/**
 * Decks Database Layer
 * 
 * Handles all database operations for decks and deck_items tables.
 * All users use fixed 60 system decks (Level 1-60).
 * Custom deck creation has been removed.
 */

import { supabase } from '@/lib/supabase';
import { Deck, DeckItem, DeckStats } from './types';

const LOG_PREFIX = '[DecksDB]';

// ============================================
// DECK OPERATIONS (Read-Only)
// ============================================

/**
 * Fetch all system decks (60 fixed decks for all users)
 */
export async function getUserDecks(userId: string): Promise<Deck[]> {
    console.log(`${LOG_PREFIX} getUserDecks called for userId:`, userId);

    // Only fetch system decks - all users share the same 60 decks
    const { data, error } = await supabase
        .from('decks')
        .select('*')
        .eq('deck_type', 'system')
        .order('level', { ascending: true });

    if (error) {
        console.error(`${LOG_PREFIX} Error fetching decks:`, error);

        // Fallback: Generate virtual decks if table doesn't exist
        if (error.code === '42P01' || error.message?.includes('relation')) {
            console.log(`${LOG_PREFIX} Table not found, returning virtual decks`);
            return generateVirtualDecks();
        }
        return [];
    }

    console.log(`${LOG_PREFIX} Found ${data?.length || 0} decks`);

    // If no decks exist, return virtual ones as fallback
    if (!data || data.length === 0) {
        console.log(`${LOG_PREFIX} No decks in DB, returning virtual decks`);
        return generateVirtualDecks();
    }

    // Ensure only system decks are returned
    return (data as Deck[]).filter(d => d.deck_type === 'system');
}

/**
 * Generate virtual level-based decks (fallback when DB is empty or unavailable)
 */
function generateVirtualDecks(): Deck[] {
    return Array.from({ length: 60 }, (_, i) => ({
        id: `virtual-level-${i + 1}`,
        name: `Level ${i + 1}`,
        description: `Content Level ${i + 1}`,
        deck_type: 'system' as const,
        level: i + 1,
        owner_id: null,
        created_at: new Date().toISOString()
    }));
}

/**
 * Get a single deck by ID
 */
export async function getDeckById(deckId: string): Promise<Deck | null> {
    console.log(`${LOG_PREFIX} getDeckById:`, deckId);

    // Handle virtual deck IDs
    if (deckId.startsWith('virtual-level-')) {
        const level = parseInt(deckId.replace('virtual-level-', ''));
        return {
            id: deckId,
            name: `Level ${level}`,
            description: `Content Level ${level}`,
            deck_type: 'system',
            level,
            owner_id: null
        };
    }

    // Check if deckId is a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(deckId);

    if (isUuid) {
        const { data, error } = await supabase
            .from('decks')
            .select('*')
            .eq('id', deckId)
            .eq('deck_type', 'system') // Only allow system decks
            .maybeSingle();

        if (error) {
            console.error(`${LOG_PREFIX} Error fetching deck:`, error);
            return null;
        }
        if (data) return data as Deck;
    }

    // Fallback: Try finding by name if it's not a UUID or not found by UUID
    const { data: byName, error: nameError } = await supabase
        .from('decks')
        .select('*')
        .eq('name', deckId)
        .eq('deck_type', 'system') // Only allow system decks
        .maybeSingle();

    if (nameError) {
        console.error(`${LOG_PREFIX} Error fetching deck by name:`, nameError);
    }

    return (byName as Deck) || null;
}

// ============================================
// DECK ITEMS OPERATIONS (Read-Only)
// ============================================

/**
 * Get all items in a deck with their KU data
 */
export async function getDeckItems(deckId: string): Promise<DeckItem[]> {
    console.log(`${LOG_PREFIX} getDeckItems for deckId:`, deckId);

    // Handle virtual deck IDs - fetch KUs by level
    if (deckId.startsWith('virtual-level-')) {
        const level = parseInt(deckId.replace('virtual-level-', ''));
        return await getKUsForLevel(level, deckId);
    }

    // Check if this is a system deck with a level
    const deck = await getDeckById(deckId);

    if (deck?.deck_type === 'system' && deck.level) {
        // For system decks, we can get items from deck_items OR fall back to level query
        const { data: items, error } = await supabase
            .from('deck_items')
            .select('*, knowledge_units(*)')
            .eq('deck_id', deckId)
            .order('position', { ascending: true });

        if (error || !items || items.length === 0) {
            // Fallback: Query KUs by level directly
            console.log(`${LOG_PREFIX} No deck_items found, falling back to level query`);
            return await getKUsForLevel(deck.level, deckId);
        }

        console.log(`${LOG_PREFIX} Found ${items.length} items in deck`);
        return items.map(item => ({
            ...item,
            ku_id: item.ku_id || item.knowledge_units?.id
        }));
    }

    // For other system decks without level, query deck_items
    const { data, error } = await supabase
        .from('deck_items')
        .select('*, knowledge_units(*), cloze_sentence_cards(*)')
        .eq('deck_id', deckId)
        .order('position', { ascending: true });

    if (error) {
        console.error(`${LOG_PREFIX} Error fetching deck items:`, error);
        return [];
    }

    console.log(`${LOG_PREFIX} Found ${data?.length || 0} items`);
    return data || [];
}

/**
 * Helper: Get KUs for a specific level (used for system decks)
 */
async function getKUsForLevel(level: number, deckId: string): Promise<DeckItem[]> {
    console.log(`${LOG_PREFIX} getKUsForLevel:`, level);

    const { data, error } = await supabase
        .from('knowledge_units')
        .select('*')
        .eq('level', level)
        .order('type', { ascending: true });

    if (error) {
        console.error(`${LOG_PREFIX} Error fetching KUs for level:`, error);
        return [];
    }

    console.log(`${LOG_PREFIX} Found ${data?.length || 0} KUs for level ${level}`);

    return (data || []).map((ku, index) => ({
        id: `${deckId}-${ku.id}`,
        deck_id: deckId,
        ku_id: ku.id,
        position: index,
        knowledge_units: ku
    }));
}

// ============================================
// DECK STATS & MASTERY
// ============================================

/**
 * Calculate mastery stats for a deck based on user's learning states
 */
export async function getDeckMasteryStats(userId: string, deckId: string): Promise<DeckStats> {
    console.log(`${LOG_PREFIX} getDeckMasteryStats:`, { userId, deckId });

    const isUserUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (!isUserUuid) return getEmptyStats();

    const items = await getDeckItems(deckId);

    // Extract valid KUs and Clozes
    const kuIds = items.map(i => i.ku_id).filter(Boolean) as string[];
    const clozeIds = items.map(i => i.cloze_id).filter(Boolean) as string[];

    if (kuIds.length === 0 && clozeIds.length === 0) {
        return {
            total: 0, due: 0, new: 0, learned: 0, coverage: 0,
            composition: { vocab: 0, kanji: 0, radical: 0, grammar: 0 },
            flashcardTypes: { vocab: 0, kanji: 0, radical: 0, cloze: 0 },
            masteryLevels: [0, 0, 0, 0, 0, 0, 0, 0],
            sentenceCoverage: { primary: 0, secondary: 0 },
            learning: 0, burned: 0
        } as any;
    }

    // 1. Fetch User States
    const { data: kuStates } = await supabase
        .from('user_learning_states')
        .select('*')
        .eq('user_id', userId)
        .in('ku_id', kuIds.length > 0 ? kuIds : ['00000000-0000-0000-0000-000000000000']);

    const { data: clozeStates } = await supabase
        .from('user_cloze_learning_states')
        .select('*')
        .eq('user_id', userId)
        .in('cloze_id', clozeIds.length > 0 ? clozeIds : ['00000000-0000-0000-0000-000000000000']);

    const now = new Date();
    const statesMap = new Map<string, any>([
        ...(kuStates?.map(s => [s.ku_id, s] as [string, any]) || []),
        ...(clozeStates?.map(s => [s.cloze_id, s] as [string, any]) || [])
    ]);

    // 2. Aggregate Results
    let learned = 0;
    let due = 0;
    let burned = 0;
    let learning = 0;

    const composition = { radical: 0, kanji: 0, vocabulary: 0, grammar: 0 };
    const flashcardTypes = { radical: 0, kanji: 0, vocab: 0, cloze: 0 };

    items.forEach(item => {
        // Count composition by Knowledge Unit Type
        if (item.knowledge_units) {
            const type = item.knowledge_units.type as keyof typeof composition;
            if (composition[type] !== undefined) composition[type]++;

            // Map to flashcard types (vocab vs vocabulary naming shift in some schemas)
            const fType = type === 'vocabulary' ? 'vocab' : type;
            if (flashcardTypes[fType as keyof typeof flashcardTypes] !== undefined) {
                flashcardTypes[fType as keyof typeof flashcardTypes]++;
            }
        } else if (item.cloze_sentence_cards) {
            flashcardTypes.cloze++;
        }

        // Check SRS State
        const id = item.ku_id || item.cloze_id;
        const state = statesMap.get(id);
        if (state) {
            learned++;
            if (state.state === 'burned') burned++;
            else learning++;

            if (state.next_review && new Date(state.next_review) <= now) {
                due++;
            }
        }
    });

    const total = items.length;
    const coverage = total > 0 ? Math.round((learned / total) * 100) : 0;

    // Normalize Composition to percentages for UI
    const compPercentages = {
        radical: total > 0 ? Math.round((composition.radical / total) * 100) : 0,
        kanji: total > 0 ? Math.round((composition.kanji / total) * 100) : 0,
        vocab: total > 0 ? Math.round((composition.vocabulary / total) * 100) : 0,
        grammar: total > 0 ? Math.round((composition.grammar / total) * 100) : 0,
    };

    const stats = {
        total,
        due,
        new: total - learned,
        learned,
        learning,
        burned,
        coverage,
        composition: compPercentages,
        flashcardTypes,
        masteryLevels: [learned > 0 ? 1 : 0, learned > 5 ? 2 : 0, learned > 10 ? 3 : 0, 0, 0, 0, 0, 0], // Placeholder mastery logic
        sentenceCoverage: {
            primary: Math.round((items.filter(i => i.ku_id).length / Math.max(total, 1)) * 100),
            secondary: 0
        }
    };

    console.log(`${LOG_PREFIX} Calculated Stats:`, stats);
    return stats as any;
}

function getEmptyStats(): DeckStats {
    return {
        total: 0, due: 0, new: 0, learned: 0, coverage: 0,
        composition: { radical: 0, kanji: 0, vocab: 0, grammar: 0 },
        flashcardTypes: { radical: 0, kanji: 0, vocab: 0, cloze: 0 },
        masteryLevels: [0, 0, 0, 0, 0, 0, 0, 0],
        sentenceCoverage: { primary: 0, secondary: 0 },
        learning: 0, burned: 0
    } as any;
}

/**
 * Update user's learning state for a KU (after SRS review)
 */
export async function updateLearningState(
    userId: string,
    kuId: string,
    updates: Record<string, any>
): Promise<void> {
    console.log(`${LOG_PREFIX} updateLearningState:`, { userId, kuId });

    const { error } = await supabase
        .from('user_learning_states')
        .upsert({
            user_id: userId,
            ku_id: kuId,
            ...updates,
            updated_at: new Date().toISOString()
        }, {
            onConflict: 'user_id,ku_id'
        });

    if (error) {
        console.error(`${LOG_PREFIX} Error updating learning state:`, error);
    }
}
