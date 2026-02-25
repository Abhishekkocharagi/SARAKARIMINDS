'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { API_BASE_URL } from '@/config';
import { useParams, useRouter } from 'next/navigation';
import { FiArrowLeft, FiClock, FiCalendar, FiShare2, FiBookmark, FiDownload, FiCheckCircle } from 'react-icons/fi';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';

export default function CurrentAffairDetailPage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [entry, setEntry] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchEntry();
    }, [id]);

    const fetchEntry = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/current-affairs/${id}`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEntry(data);
            } else {
                router.push('/current-affairs'); // Redirect if not found
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleSave = async () => {
        if (!user || !entry) return;
        try {
            await fetch(`${API_BASE_URL}/api/current-affairs/${entry._id}/save`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            setEntry((prev: any) => ({
                ...prev,
                saves: prev.saves.includes(user._id)
                    ? prev.saves.filter((uid: string) => uid !== user._id)
                    : [...prev.saves, user._id]
            }));
        } catch (error) {
            console.error(error);
        }
    };

    const handleMarkRead = async () => {
        if (!user || !entry) return;
        try {
            await fetch(`${API_BASE_URL}/api/current-affairs/${entry._id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            setEntry((prev: any) => ({
                ...prev,
                reads: [...(prev.reads || []), user._id]
            }));
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-gray-400 uppercase tracking-widest">Loading Article...</div>;
    if (!entry) return null;

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-20 flex flex-col md:flex-row gap-8">
                {/* Sidebar (Desktop) */}
                <div className="hidden md:block w-[280px] shrink-0">
                    <Sidebar />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <button
                        onClick={() => router.back()}
                        className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-xs font-black uppercase tracking-widest"
                    >
                        <FiArrowLeft /> Back to Feed
                    </button>

                    <article className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden relative">
                        {/* Header Gradient */}
                        <div className={`h-2 bg-gradient-to-r ${entry.primaryCategory === 'Polity' ? 'from-indigo-500 to-purple-600' :
                            entry.primaryCategory === 'Economy' ? 'from-green-500 to-emerald-600' :
                                entry.primaryCategory === 'Science & Technology' ? 'from-blue-500 to-cyan-600' :
                                    'from-gray-500 to-gray-700'
                            }`} />

                        <div className="p-6 md:p-12">
                            {/* Meta Tags */}
                            <div className="flex flex-wrap gap-3 mb-6">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${entry.primaryCategory === 'Polity' ? 'bg-indigo-50 text-indigo-700' :
                                    entry.primaryCategory === 'Economy' ? 'bg-green-50 text-green-700' :
                                        'bg-blue-50 text-blue-700'
                                    }`}>
                                    {entry.primaryCategory}
                                </span>
                                <span className="flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                    <FiCalendar /> {new Date(entry.date).toLocaleDateString()}
                                </span>
                                {(entry.reads || []).length > 0 && (
                                    <span className="flex items-center gap-1 px-3 py-1 bg-yellow-50 text-yellow-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                        <FiClock /> {entry.reads.length} Reads
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-6 leading-tight">
                                {entry.title}
                            </h1>

                            {/* Short Summary Box */}
                            {entry.shortSummary && (
                                <div className="mb-10 p-6 bg-blue-50 rounded-2xl border border-blue-100 relative">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl"></div>
                                    <h3 className="text-xs font-black uppercase tracking-widest text-blue-800 mb-3 opacity-70">Key Highlights</h3>
                                    <ul className="space-y-2">
                                        {entry.shortSummary.split('\n').map((point: string, idx: number) => (
                                            <li key={idx} className="flex gap-3 text-gray-700 text-sm font-medium leading-relaxed">
                                                <span className="text-blue-500 font-bold">•</span>
                                                {point.replace(/^-\s*/, '')}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Full Content */}
                            <div className="prose prose-lg prose-blue max-w-none text-gray-800 leading-loose font-serif">
                                <div className="whitespace-pre-line">
                                    {entry.fullSummary || entry.description}
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleToggleSave}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entry.saves.includes(user?._id)
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                            }`}
                                    >
                                        <FiBookmark className={entry.saves.includes(user?._id) ? 'fill-current' : ''} />
                                        {entry.saves.includes(user?._id) ? 'Saved' : 'Save for Later'}
                                    </button>

                                    {entry.pdfUrl && (
                                        <a
                                            href={entry.pdfUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            <FiDownload /> Download PDF
                                        </a>
                                    )}
                                </div>

                                <button
                                    onClick={handleMarkRead}
                                    disabled={entry.reads.includes(user?._id)}
                                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg ${entry.reads.includes(user?._id)
                                        ? 'bg-green-50 text-green-600 cursor-default shadow-none border border-green-100'
                                        : 'bg-gray-900 text-white hover:bg-blue-700 hover:shadow-blue-200'
                                        }`}
                                >
                                    {entry.reads.includes(user?._id) ? (
                                        <>
                                            <FiCheckCircle /> Marked as Read
                                        </>
                                    ) : (
                                        'Mark as Read'
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Source Credit */}
                        {entry.source && (
                            <div className="bg-gray-50 px-8 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center border-t border-gray-100">
                                Source: {entry.source}
                            </div>
                        )}
                    </article>

                    {/* Next/Prev Navigation could go here */}
                </div>
            </main>
        </div>
    );
}
