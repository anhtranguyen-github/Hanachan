
import { KUDetailView } from "@/features/knowledge/components/KUDetailView";

export default function KanjiDetailPage({ params }: { params: { slug: string } }) {
    return <KUDetailView slug={params.slug} type="kanji" />;
}
