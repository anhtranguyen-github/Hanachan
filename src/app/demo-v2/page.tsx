import React from 'react';

export default function LandingPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-12 py-10">
            <section className="text-center space-y-4">
                <h1 className="text-5xl font-black text-gray-900 tracking-tight">Master Japanese with Science</h1>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                    The ultimate platform for structured language acquisition through SRS and AI context.
                </p>
                <div className="flex justify-center gap-4 pt-4">
                    <button className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg hover:translate-y-[-2px] transition-all">
                        Get Started
                    </button>
                    <button className="px-8 py-3 bg-white text-gray-700 font-bold rounded-2xl border-2 border-gray-100 shadow-sm hover:bg-gray-50 transition-all">
                        Login
                    </button>
                </div>
            </section>

            <div className="grid grid-cols-3 gap-8 pt-12">
                {[
                    { title: 'Learn', desc: 'A structured path through the Japanese language, from N5 to N1.', color: 'bg-primary/5' },
                    { title: 'Review', desc: 'Spaced Repetition System (SRS) for long-term memory maintenance.', color: 'bg-kanji/5' },
                    { title: 'Chat', desc: 'Practice real-world communication with our AI language partner.', color: 'bg-vocab/5' },
                ].map((feat) => (
                    <div key={feat.title} className={`${feat.color} p-8 rounded-3xl border border-white/50 shadow-sm`}>
                        <h3 className="text-xl font-bold mb-2 text-gray-800">{feat.title}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed font-medium">{feat.desc}</p>
                    </div>
                ))}
            </div>

            <section className="bg-gray-50 p-12 rounded-[40px] border border-gray-300 flex flex-col items-center text-center">
                <div className="max-w-xl space-y-8">
                    {[
                        'Master Knowledge Units targeted to your level.',
                        'Engage with multimedia lessons and immersive context.',
                        'Review at optimal intervals with our SRS engine.',
                    ].map((text, i) => (
                        <p key={i} className="text-xl text-gray-700 font-bold leading-tight">{text}</p>
                    ))}
                </div>
            </section>
        </div>
    );
}
