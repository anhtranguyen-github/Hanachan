import React from 'react';
import Link from 'next/link';

export default function ReviewEntry() {
    return (
        <div className="max-w-2xl mx-auto space-y-8 py-20 flex items-center justify-center min-h-[80vh]">
            <div className="w-full bg-white border-2 border-[#F0E0E0] p-12 rounded-[48px] shadow-2xl shadow-[#3E4A61]/5 text-center space-y-10 group transition-all hover:border-[#FFB5B5]">

                <div className="space-y-4">
                    <div className="w-20 h-20 bg-[#FFF5F5] rounded-[32px] flex items-center justify-center mx-auto text-[#FFB5B5] group-hover:scale-110 transition-transform duration-500">
                        <span className="text-3xl font-black">115</span>
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-[#3E4A61] tracking-tighter uppercase">Ready for Review</h1>
                        <p className="text-[#A0AEC0] font-bold text-sm">Strengthen your memory with a quick session.</p>
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    <Link
                        href="/demo-v2/review/batch"
                        className="block w-full py-6 bg-[#3E4A61] text-white text-xl font-black rounded-[32px] shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all tracking-widest"
                    >
                        START NOW
                    </Link>

                    <p className="text-[10px] font-black text-[#CBD5E0] uppercase tracking-[0.2em]">
                        Estimated time: 5-8 minutes
                    </p>
                </div>
            </div>
        </div>
    );
}
