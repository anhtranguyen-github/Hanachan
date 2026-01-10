'use server';

import { createClient } from '@/services/supabase/server'; // Use server client
import { youtubeService } from './service';
import { getUserVideos, deleteVideo } from './db';
import { revalidatePath } from 'next/cache';

export async function importVideoAction(url: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    try {
        const video = await youtubeService.importVideo(user.id, url, supabase); // Inject server client
        revalidatePath('/immersion');
        return { success: true, video };
    } catch (e: any) {
        console.error("Import Action Failed", e);
        return { success: false, error: e.message };
    }
}

export async function fetchUserVideosAction() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // DIRECT QUERY to avoid client-side supabase instantiation in db.ts causing issues in server action context or vice versa if methods differ
    const { data, error } = await supabase
        .from('user_youtube_videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("fetchUserVideosAction error", error);
        return [];
    }
    return data;
}

export async function deleteVideoAction(id: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    await deleteVideo(id);
    revalidatePath('/immersion');
}

export async function getTranscriptAction(videoId: string) {
    try {
        return await youtubeService.getTranscript(videoId);
    } catch (e) {
        console.error("Transcript fetch failed", e);
        return [];
    }
}

export async function mineCardAction(card: { front: string; back: string; sentence?: string; videoId?: string }) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    // 1. Check or Create Knowledge Unit
    const slug = `vocabulary/${card.front}`;
    let kuId: string;

    const { data: existingKU } = await supabase
        .from('knowledge_units')
        .select('id')
        .eq('slug', slug)
        .single();

    if (existingKU) {
        kuId = existingKU.id;
    } else {
        // Create new minimal KU
        const { data: newKU, error } = await supabase
            .from('knowledge_units')
            .insert({
                slug,
                type: 'vocabulary',
                character: card.front,
                meaning: card.back,
                level: 0, // 0 = Custom/Mined
                metadata: { source: 'mining', original_sentence: card.sentence }
            })
            .select('id')
            .single();

        if (error) {
            console.error("Failed to create KU during mining", error);
            throw new Error("Could not create flashcard base.");
        }
        kuId = newKU.id;
    }

    // 2. Add to User Learning States (SRS)
    // Check if already learning
    const { data: existingState } = await supabase
        .from('user_learning_states')
        .select('id')
        .eq('user_id', user.id)
        .eq('ku_id', kuId)
        .single();

    if (existingState) {
        return { success: true, message: "Already in your deck!" };
    }

    const { error: srsError } = await supabase
        .from('user_learning_states')
        .insert({
            user_id: user.id,
            ku_id: kuId,
            state: 'new',
            srs_stage: 0,
            next_review: new Date().toISOString(),
            stability: 2.5
        });

    if (srsError) {
        console.error("SRS Init failed", srsError);
        throw new Error("Failed to add to SRS.");
    }

    return { success: true, message: "Card mined successfully!" };
}
