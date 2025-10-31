
import { createClient } from '@/services/supabase/server';
import { getDueCards } from '@/features/learning/repository';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ count: 0 });
        }

        const dueCards = await getDueCards(user.id, 500); // Fetch enough to count reliably
        return NextResponse.json({ count: dueCards.length });
    } catch (error) {
        return NextResponse.json({ count: 0 });
    }
}
