import { createClient } from '@/services/supabase/server';
import { learningService } from '@/features/learning/service';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ count: 0 });
        }

        const count = await learningService.getDueCount(user.id);
        return NextResponse.json({ count });
    } catch (error) {
        return NextResponse.json({ count: 0 });
    }
}
