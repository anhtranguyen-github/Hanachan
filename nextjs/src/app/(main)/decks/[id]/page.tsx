
'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/features/auth/AuthContext';
import { getUserLevelsAction } from '@/features/levels/actions';
import Link from 'next/link';
import { clsx } from 'clsx';

export default function LevelDetailsPage() {
    const params = useParams();
    const levelId = params.id as string;
    const router = useRouter();
    const { user } = useUser();
    const [level, setLevel] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && levelId) {
            const loadData = async () => {
                setLoading(true);
                const result = await getUserLevelsAction(user!.id);
                if (result.success) {
                    const currentLevel = result.data!.find(l => l.id === levelId);
                    setLevel(currentLevel);
                    setStats(currentLevel?.stats || {
                        coverage: 0,
                        composition: { vocab: 0, kanji: 0, radical: 0 },
                        flashcardTypes: {},
                        masteryLevels: [],
                        sentenceCoverage: { primary: 0, secondary: 0 },
                        new: 0, learning: 0, due: 0, burned: 0, total: 0
                    });
                }
                setLoading(false);
            };
            loadData();
        }
    }, [user, levelId]);

    if (loading) return <div className="p-4">Loading...</div>;
    if (!level) return <div className="p-4">Level not found.</div>;

    return (
        <div className="max-w-3xl mx-auto flex flex-col gap-8 py-4">
            <Link href="/levels" className="text-sm underline">
                &lsaquo; Back to Levels
            </Link>

            <header className="border border-black p-8 flex flex-col items-center gap-4">
                <h1 className="text-3xl font-bold uppercase">{level.name}</h1>
                <p className="text-center text-gray-500">{level.description}</p>
                <div className="flex gap-4 mt-4">
                    <div className="border border-black p-4 text-center">
                        <div className="text-[10px] font-bold uppercase">Completion</div>
                        <div className="text-2xl font-bold">{stats.coverage}%</div>
                    </div>
                    <button
                        onClick={() => router.push(`/levels/${levelId}/session`)}
                        className="bg-black text-white px-8 py-4 font-bold uppercase hover:bg-gray-800"
                    >
                        Start Session
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <section className="border border-black p-6">
                    <h2 className="font-bold border-b border-black mb-4 uppercase text-sm">Composition</h2>
                    <div className="flex flex-col gap-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Vocabulary</span>
                            <span className="font-bold">{stats.composition.vocab}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Kanji</span>
                            <span className="font-bold">{stats.composition.kanji}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Radicals</span>
                            <span className="font-bold">{stats.composition.radical}%</span>
                        </div>
                    </div>
                </section>

                <section className="border border-black p-6">
                    <h2 className="font-bold border-b border-black mb-4 uppercase text-sm">Learning State</h2>
                    <div className="flex flex-col gap-2 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>New</span>
                            <span className="font-bold">{stats.new}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Learning</span>
                            <span className="font-bold">{stats.learning}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Due</span>
                            <span className="font-bold">{stats.due}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Burned</span>
                            <span className="font-bold">{stats.burned}</span>
                        </div>
                    </div>
                </section>

                <section className="border border-black p-6">
                    <h2 className="font-bold border-b border-black mb-4 uppercase text-sm">Context Coverage</h2>
                    <div className="flex flex-col gap-4 text-sm text-gray-600">
                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Primary Examples</span>
                                <span className="font-bold">{stats.sentenceCoverage.primary}%</span>
                            </div>
                            <div className="w-full h-1 bg-gray-100 border border-black">
                                <div className="h-full bg-black" style={{ width: `${stats.sentenceCoverage.primary}%` }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-1">
                                <span>Secondary Examples</span>
                                <span className="font-bold">{stats.sentenceCoverage.secondary}%</span>
                            </div>
                            <div className="w-full h-1 bg-gray-100 border border-black">
                                <div className="h-full bg-black" style={{ width: `${stats.sentenceCoverage.secondary}%` }} />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border border-black p-6">
                    <h2 className="font-bold border-b border-black mb-4 uppercase text-sm">Flashcard Types</h2>
                    <div className="flex flex-col gap-2 text-sm text-gray-600">
                        {Object.entries(stats.flashcardTypes).map(([type, count]: [string, any]) => (
                            <div key={type} className="flex justify-between">
                                <span className="capitalize">{type}</span>
                                <span className="font-bold">{count}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}


function FunnelRow({ label, count, total, color }: { label: string, count: number, total: number, color: string }) {
    const percent = total > 0 ? (count / total) * 100 : 0;
    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between text-[10px] font-black px-1 uppercase scale-90 origin-left">
                <span>{label}</span>
                <span className="opacity-60">{count}</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div className={clsx("h-full transition-all duration-700", color)} style={{ width: `${percent}%` }} />
            </div>
        </div>
    );
}

