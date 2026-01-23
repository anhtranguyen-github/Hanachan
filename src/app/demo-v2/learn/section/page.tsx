import React from 'react';
import Link from 'next/link';

export default function LearnSectionList() {
    const sections = [
        { name: 'Base Section', href: '/demo-v2/learn/section/base', color: 'bg-primary' },
        { name: 'Grammar Section', href: '/demo-v2/learn/section/grammar', color: 'bg-grammar' },
        { name: 'Vocab Section', href: '/demo-v2/learn/section/vocab', color: 'bg-vocab' },
        { name: 'Kanji Section', href: '/demo-v2/learn/section/kanji', color: 'bg-kanji' },
        { name: 'Radical Section', href: '/demo-v2/learn/section/radical', color: 'bg-radical' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-black text-gray-900">Sections</h1>
                <p className="text-gray-500">Choose a learning category to focus on.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section) => (
                    <Link
                        key={section.href}
                        href={section.href}
                        className="group bg-white border border-gray-300 p-8 rounded-[32px] shadow-sm hover:shadow-xl hover:translate-y-[-4px] transition-all"
                    >
                        <div className={`w-12 h-12 ${section.color} rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform`}></div>
                        <h3 className="text-xl font-bold mb-2">{section.name}</h3>
                        <p className="text-sm text-gray-400 font-medium">Explore curriculum items and structured paths for {section.name.split(' ')[0]}.</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
