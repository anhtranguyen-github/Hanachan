
import { createClient } from '@/services/supabase/server';
import { sentenceRepo } from '../sentence/sentence-repo'; // Use Real Repo
import { FSRSState, InitialState, calculateNextState } from './fsrs-engine';
import { FlashcardEntity } from './types';

const DUMMY_USER_ID = "00000000-0000-0000-0000-000000000000";

export class FlashcardService {

    /**
     * Creates a card derived from a Root Sentence.
     */
    async createDerivedCard(
        sentenceId: string,
        type: 'vocab' | 'cloze',
        content: { front: string; back: string; targetSlug?: string },
        userId: string = DUMMY_USER_ID
    ) {
        // 1. Validate Parent (Optional, DB constraint handles this too but good for UX)
        const root = await sentenceRepo.getById(sentenceId);
        if (!root) {
            console.error(`❌ Parent Sentence ${sentenceId} not found!`);
            return;
        }

        const supabase = createClient();

        // 2. Insert Card
        const payload = {
            sentence_id: sentenceId,
            card_type: type,
            front: content.front,
            back: content.back,
            target_slug: content.targetSlug,
            fsrs_state: InitialState,
            next_review: new Date().toISOString(),
            user_id: userId
        };

        const { data, error } = await supabase
            .from('user_sentence_cards')
            .insert(payload)
            .select()
            .single();

        if (error) {
            console.error("❌ Error creating card:", error);
            return;
        }

        console.log(`📇 Created DB Card: "${content.front}" (Tyoe: ${type})`);
        return data as FlashcardEntity;
    }

    async getDueCards(userId: string = DUMMY_USER_ID) {
        const supabase = createClient();
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('user_sentence_cards')
            .select('*')
            .eq('user_id', userId)
            .lte('next_review', now);

        if (error) {
            console.error("❌ Error fetching due cards:", error);
            return [];
        }

        return (data || []) as FlashcardEntity[];
    }

    /**
     * Filters cards by their root sentence's source.
     * Uses Supabase Join (inner join via !inner)
     */
    async getCardsBySource(sourceType: string, userId: string = DUMMY_USER_ID) {
        const supabase = createClient();
        const { data, error } = await supabase
            .from('user_sentence_cards')
            .select('*, sentences!inner(source_type)')
            .eq('user_id', userId)
            .eq('sentences.source_type', sourceType);

        if (error) {
            console.error(`❌ Error fetching cards for source ${sourceType}:`, error);
            return [];
        }

        return (data || []) as FlashcardEntity[];
    }

    async submitReview(cardId: string, rating: 1 | 2 | 3 | 4) {
        const supabase = createClient();

        // 1. Get Current State
        const { data: card } = await supabase
            .from('user_sentence_cards')
            .select('fsrs_state')
            .eq('id', cardId)
            .single();

        if (!card) return;

        // 2. Calculate New State
        const currentState = card.fsrs_state as unknown as FSRSState;
        const newState = calculateNextState(currentState, rating);

        // 3. Update DB
        const { error } = await supabase
            .from('user_sentence_cards')
            .update({
                fsrs_state: newState,
                next_review: new Date(newState.nextReview).toISOString()
            })
            .eq('id', cardId);

        if (!error) {
            console.log(`📝 Updated Card ${cardId} FSRS State (Interval: ${newState.interval.toFixed(1)} days)`);
        }
    }
}

export const flashcardService = new FlashcardService();
