
import { getDueCardsAction } from '@/modules/learning/actions';
import { ReviewSession } from '@/modules/learning/components/ReviewSession';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'SRS Review | Hanachan',
    description: 'Review your Kanji, Vocabulary, and Grammar using the FSRS algorithm.',
};

export default async function ReviewPage() {
    // Fetch initial batch of due cards
    // The cast is to handle the complex nested type from Supabase query
    const dueCards = await getDueCardsAction(10) as any[];

    return (
        <main className="min-h-screen bg-black text-white pt-24 pb-12 px-6">
            <ReviewSession initialCards={dueCards} />
        </main>
    );
}
