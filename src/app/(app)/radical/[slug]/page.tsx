
import { KUDetailView } from "@/features/knowledge/components/KUDetailView";

export default function RadicalDetailPage({ params }: { params: { slug: string } }) {
    return <KUDetailView slug={params.slug} type="radical" />;
}
