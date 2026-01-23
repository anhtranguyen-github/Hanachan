import React from 'react';
import Link from 'next/link';

export default function ContentHome() {
    const categories = [
        { name: 'Grammar', href: '/demo-v2/content/grammar', color: 'bg-grammar', count: '142 points' },
        { name: 'Vocabulary', href: '/demo-v2/content/vocab', color: 'bg-vocab', count: '12,400 words' },
        { name: 'Kanji', href: '/demo-v2/content/kanji', color: 'bg-kanji', count: '2,136 characters' },
        { name: 'Radicals', href: '/demo-v2/content/radical', color: 'bg-radical', count: '214 items' },
    ];

    return (
        <div className="space-y-12">
            <div>
                <h1 className="text-3xl font-black text-gray-900">Library</h1>
                <p className="text-gray-500">Explore the knowledge base.</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
                {categories.map((cat) => (
                    <Link
                        key={cat.href}
                        href={cat.href}
                        className="group bg-white border-2 border-gray-300 p-10 rounded-[40px] shadow-sm hover:shadow-2xl transition-all flex items-center justify-between"
                    >
                        <div>
                            <h3 className="text-2xl font-black mb-1 group-hover:text-primary transition-colors">{cat.name}</h3>
                            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">{cat.count}</p>
                        </div>
                        <div className={`w-16 h-16 ${cat.color} rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg group-hover:rotate-12 transition-transform`}>
                            {cat.name[0]}
                        </div>
                    </Link>
                ))}
            </div>

            <section className="bg-gray-50 p-10 rounded-[40px] border-2 border-gray-300 space-y-6">
                <h2 className="text-xl font-bold">Quick Search</h2>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search for any item, reading, or meaning..."
                        className="w-full py-5 px-8 bg-white border-2 border-gray-200 focus:border-primary rounded-3xl shadow-sm outline-none transition-all font-medium"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 font-black">🔍</div>
                </div>
            </section>
        </div>
    );
}
