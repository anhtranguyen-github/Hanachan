
import { KUDetailView } from "@/features/knowledge/components/KUDetailView";

export default function GrammarDetailPage({ params }: { params: { slug: string } }) {
    return <KUDetailView slug={params.slug} type="grammar" />;
}
