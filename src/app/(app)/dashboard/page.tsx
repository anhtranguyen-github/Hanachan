
import { createClient } from '@/services/supabase/server';
import { flashcardService } from '@/features/deck/flashcard-service';
import { analyticsService } from '@/features/analytics/service';
import { DashboardContent } from './DashboardContent';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/signin');
    }

    // Parallel Data Fetching
    let statsRes: any = {};
    let dueCards: any[] = [];

    try {
        [statsRes, dueCards] = await Promise.all([
            analyticsService.getDashboardStats(user.id).catch(e => ({})),
            flashcardService.getDueCards(user.id).catch(e => [])
        ]);
    } catch (error) {
        console.error("Dashboard Fetch Error:", error);
    }

    // Fetch total learned from user_learning_states
    const { count: totalLearnedCount } = await supabase
        .from('user_learning_states')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    const { count: burnedCount } = await supabase
        .from('user_learning_states')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('state', 'burned');

    const stats = {
        totalLearned: (totalLearnedCount || 0) + (dueCards.length), // Combined count
        burnedCount: burnedCount || 0,
        dueCount: dueCards.length
    };

    return <DashboardContent user={user} stats={stats} />;
}
