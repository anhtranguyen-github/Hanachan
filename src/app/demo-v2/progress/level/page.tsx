import React from 'react';

export default function LevelProgress() {
    return (
        <div className="space-y-12">
            <h1 className="text-3xl font-black">Level 12 Progression</h1>
            <div className="bg-white border border-gray-300 p-10 rounded-[40px] shadow-sm space-y-12">
                <div className="flex items-center gap-10">
                     <div className="w-32 h-32 bg-primary text-white text-5xl font-black rounded-[32px] flex items-center justify-center shadow-lg">12</div>
                     <div className="flex-1 space-y-4">
                        <div className="flex justify-between font-bold">
                            <span>Level Progress</span>
                            <span>24 / 30 Kanji</span>
                        </div>
                        <div className="h-4 bg-gray-50 rounded-full overflow-hidden border">
                            <div className="w-[80%] h-full bg-primary"></div>
                        </div>
                     </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 30 }).map((_, i) => (
                        <div key={i} className={`p-4 border rounded-2xl text-center ${i < 24 ? 'border-primary bg-primary/5' : 'border-gray-100 bg-white opacity-40'}`}>
                            <span className="text-2xl font-black">字</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
