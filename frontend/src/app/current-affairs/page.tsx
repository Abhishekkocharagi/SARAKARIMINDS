'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { API_BASE_URL } from '@/config';
import { FiBookmark, FiCheckCircle, FiShare2, FiCalendar, FiFilter, FiDownload, FiGlobe } from 'react-icons/fi';

import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const CurrentAffairsContent = () => {
    const { user, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('today'); // today, yesterday, week
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const categories = [
        { name: t('ca.cat.all'), value: 'All' },
        { name: t('ca.cat.polity'), value: 'Polity' },
        { name: t('ca.cat.economy'), value: 'Economy' },
        { name: t('ca.cat.science'), value: 'Science & Technology' },
        { name: t('ca.cat.environment'), value: 'Environment' },
        { name: t('ca.cat.international'), value: 'International Relations' },
        { name: t('ca.cat.schemes'), value: 'Government Schemes' },
        { name: t('ca.cat.karnataka'), value: 'Karnataka State Affairs' },
        { name: t('ca.cat.misc'), value: 'Miscellaneous' },
        { name: t('ca.cat.sports'), value: 'Sports' },
        { name: t('ca.cat.awards'), value: 'Awards' },
        { name: t('ca.cat.appointments'), value: 'Appointments' }
    ];

    useEffect(() => {
        const cat = searchParams.get('category');
        if (cat) {
            const slugToValue: Record<string, string> = {
                'polity': 'Polity',
                'economy': 'Economy',
                'science-tech': 'Science & Technology',
                'environment': 'Environment',
                'international-relations': 'International Relations',
                'government-schemes': 'Government Schemes',
                'karnataka-state-affairs': 'Karnataka State Affairs',
                'miscellaneous': 'Miscellaneous',
                'sports': 'Sports',
                'awards': 'Awards',
                'appointments': 'Appointments'
            };
            setSelectedCategory(slugToValue[cat] || 'All');
        } else {
            setSelectedCategory('All');
        }
    }, [searchParams]);

    useEffect(() => {
        if (user) {
            fetchEntries();
        }
    }, [user, activeTab, selectedCategory]);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            let url = `${API_BASE_URL}/api/current-affairs?dateFilter=${activeTab}`;
            if (selectedCategory !== 'All') {
                url += `&category=${selectedCategory}`;
            }

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });

            if (res.ok) {
                const data = await res.json();
                // Ensure uniqueness of entries by _id to prevent duplicate key errors
                const uniqueEntries = Array.from(new Map(data.map((item: any) => [item._id, item])).values());
                setEntries(uniqueEntries);
            }
        } catch (error) {
            console.error('Failed to fetch current affairs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id: string) => {
        try {
            await fetch(`${API_BASE_URL}/api/current-affairs/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            // Optimistic update
            setEntries(prev => prev.map(e => e._id === id ? { ...e, reads: [...(e.reads || []), user?._id] } : e));
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleSave = async (id: string) => {
        try {
            await fetch(`${API_BASE_URL}/api/current-affairs/${id}/save`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            // Optimistic update
            setEntries(prev => prev.map(e => {
                if (e._id === id) {
                    const isSaved = e.saves.includes(user?._id);
                    return { ...e, saves: isSaved ? e.saves.filter((uid: string) => uid !== user?._id) : [...e.saves, user?._id] };
                }
                return e;
            }));
        } catch (error) {
            console.error(error);
        }
    };

    const getCatLabel = (cat: string) => {
        // Simple fallback
        return cat;
    };

    if (authLoading) return <div className="p-10 text-center">{t('common.loading')}</div>;

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 pt-6 pb-10 flex flex-col md:flex-row gap-6">
                <Sidebar />

                <div className="flex-1 min-w-0 space-y-6">
                    {/* Header Card */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="relative z-10 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center shadow-lg">
                                <FiGlobe size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
                                    {t('ca.title').split(' ')[0]} <span className="text-blue-700">{t('ca.title').split(' ').slice(1).join(' ')}</span>
                                </h1>
                                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-2">
                                    {t('ca.subtitle')}
                                </p>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[4rem] -mr-4 -mt-4 opacity-50"></div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
                        {/* Time Tabs */}
                        <div className="flex p-1 bg-gray-100 rounded-xl w-full sm:w-fit">
                            {['today', 'yesterday', 'week'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab
                                        ? 'bg-white text-blue-700 shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                        }`}
                                >
                                    {tab === 'week' ? t('ca.this_week') : tab === 'today' ? t('ca.today') : t('ca.yesterday')}
                                </button>
                            ))}
                        </div>

                        {/* Categories */}
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                            {categories.map(cat => (
                                <button
                                    key={cat.value}
                                    onClick={() => {
                                        setSelectedCategory(cat.value);
                                        // Update URL without refresh
                                        // router.push(`?category=${cat.value}`); // Optional, maybe just fetch
                                    }}
                                    className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wide whitespace-nowrap transition-colors border ${selectedCategory === cat.value
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content List */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-400 font-bold uppercase text-xs tracking-widest">{t('ca.loading')}</div>
                    ) : entries.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                            <div className="text-4xl mb-3">📰</div>
                            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">{t('ca.no_updates')}</p>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {entries.map(entry => (
                                <div key={entry._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative overflow-hidden">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${entry.primaryCategory === 'Polity' ? 'bg-indigo-50 text-indigo-700' :
                                            entry.primaryCategory === 'Economy' ? 'bg-green-50 text-green-700' :
                                                entry.primaryCategory === 'Science & Technology' ? 'bg-purple-50 text-purple-700' :
                                                    'bg-blue-50 text-blue-700'
                                            }`}>
                                            {entry.primaryCategory || entry.category}
                                        </span>
                                        {entry.secondaryCategory && (
                                            <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded-md text-[9px] font-bold uppercase tracking-widest border border-gray-100">
                                                {entry.secondaryCategory}
                                            </span>
                                        )}
                                        {entry.difficulty && (
                                            <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest border ${entry.difficulty === 'Easy' ? 'border-green-200 text-green-600' :
                                                entry.difficulty === 'Moderate' ? 'border-yellow-200 text-yellow-600' :
                                                    'border-red-200 text-red-600'
                                                }`}>
                                                {entry.difficulty}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-black text-gray-900 mb-3 leading-tight group-hover:text-blue-800 transition-colors">
                                        {entry.title}
                                    </h3>

                                    {/* Short Summary (Bullet Points) */}
                                    <div className="text-gray-600 text-sm leading-relaxed mb-6 font-medium">
                                        {entry.shortSummary ? (
                                            <ul className="list-disc pl-4 space-y-1">
                                                {entry.shortSummary.split('\n').slice(0, 3).map((point: string, idx: number) => (
                                                    <li key={idx} className="pl-1">{point.replace(/^-\s*/, '')}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="line-clamp-3">{entry.description || entry.fullSummary}</p>
                                        )}
                                    </div>

                                    <Link href={`/current-affairs/${entry._id}`} className="inline-block mt-2 text-[11px] font-black uppercase tracking-widest text-blue-600 hover:underline">
                                        Read Full Analysis &rarr;
                                    </Link>

                                    {/* Action Bar */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleToggleSave(entry._id)}
                                                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${entry.saves.includes(user?._id) ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
                                                    }`}
                                            >
                                                <FiBookmark className={entry.saves.includes(user?._id) ? 'fill-current' : ''} />
                                                {entry.saves.includes(user?._id) ? t('ca.saved') : t('ca.save')}
                                            </button>

                                            {entry.pdfUrl && (
                                                <a
                                                    href={entry.pdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors"
                                                >
                                                    <FiDownload /> {t('ca.pdf')}
                                                </a>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-bold text-gray-300 uppercase">
                                                {new Date(entry.date).toLocaleDateString()}
                                            </span>
                                            <button
                                                onClick={() => handleMarkRead(entry._id)}
                                                disabled={entry.reads.includes(user?._id)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${entry.reads.includes(user?._id)
                                                    ? 'bg-green-50 text-green-600 cursor-default'
                                                    : 'bg-gray-900 text-white hover:bg-blue-700 shadow-lg hover:shadow-blue-200'
                                                    }`}
                                            >
                                                {entry.reads.includes(user?._id) ? (
                                                    <><FiCheckCircle /> {t('ca.read')}</>
                                                ) : (
                                                    t('ca.mark_read')
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default function CurrentAffairsPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center font-bold">Loading...</div>}>
            <CurrentAffairsContent />
        </Suspense>
    );
}
