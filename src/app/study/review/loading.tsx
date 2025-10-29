
import { Loader2 } from 'lucide-react'

export default function Loading() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4 pt-24">
            <Loader2 className="animate-spin text-white/20" size={48} />
            <div className="text-white/40 text-sm font-medium tracking-widest uppercase animate-pulse">
                Prepping your review session...
            </div>
        </div>
    )
}
