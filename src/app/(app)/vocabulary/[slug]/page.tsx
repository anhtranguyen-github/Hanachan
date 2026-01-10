
import { KUDetailView } from "@/features/knowledge/components/KUDetailView";

export default function VocabularyDetailPage({ params }: { params: { slug: string } }) {
    return <KUDetailView slug={params.slug} type="vocabulary" />;
}
