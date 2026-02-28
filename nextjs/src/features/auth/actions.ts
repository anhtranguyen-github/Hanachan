'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { provisionUserProfile } from './db'

export async function syncUserAction(userId: string, email: string, displayName?: string, avatarUrl?: string) {
    try {
        await provisionUserProfile(userId, email, displayName, avatarUrl);
        return { success: true };
    } catch (e: any) {
        console.error("Sync User failed:", e);
        return { success: false, error: e.message };
    }
}

export async function login(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/', 'layout');
    // Don't redirect - let client handle staying on current page
    return { success: true };
}

export async function signup(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                display_name: fullName,
            },
        },
    });

    if (error) {
        return { success: false, message: error.message };
    }

    if (data.user) {
        await provisionUserProfile(data.user.id, email, fullName);
    }

    return { success: true, message: 'Enrollment successful. Verification protocol initiated.' };
}

export async function logout() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        revalidatePath('/', 'layout')
        // Don't redirect - stay on current page
    }
}
