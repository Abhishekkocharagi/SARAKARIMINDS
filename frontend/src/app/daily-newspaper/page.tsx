'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { API_BASE_URL } from '@/config';

export default function DailyNewspaperPage() {
    const { user, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const router = useRouter();
    const [newspapers, setNewspapers] = useState<any[]>([]);
    const [selectedNews, setSelectedNews] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'summary' | 'pdf'>('summary');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchNewspapers();
        }
    }, [user]);

    const fetchNewspapers = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/daily-newspapers`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNewspapers(data);
            }
        } catch (error) {
            console.error('Failed to fetch newspapers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewNews = async (news: any) => {
        setSelectedNews(news);
        setViewMode('summary'); // Default to summary view as requested

        // Record view
        try {
            await fetch(`${API_BASE_URL}/api/daily-newspapers/${news._id}/view`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
        } catch (error) {
            console.error('Failed to record view:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(t('sidebar.language') === 'kn' ? 'kn-IN' : 'en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    };

    // Parse topic-wise content
    const formatNewsContent = (content: string) => {
        if (!content) return null;

        // Split by topics (lines starting with #)
        const parts = content.split(/(^#\s.*)/m);

        return parts.map((part, index) => {
            if (part.startsWith('#')) {
                return (
                    <h3 key={index} className="text-xl font-black text-blue-700 mt-10 mb-4 uppercase tracking-wider flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                        {part.replace('#', '').trim()}
                    </h3>
                );
            }
            return (
                <div key={index} className="space-y-4">
                    {part.split('\n').map((line, lIdx) => {
                        const trimmedLine = line.trim();
                        if (!trimmedLine) return null;

                        // Handle bullet points
                        if (trimmedLine.startsWith('*')) {
                            return (
                                <div key={lIdx} className="flex gap-4 items-start pl-2 group">
                                    <span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 group-hover:bg-blue-600 transition-colors"></span>
                                    <p className="text-gray-700 leading-relaxed font-medium">
                                        {formatLineWithBold(trimmedLine.replace('*', '').trim())}
                                    </p>
                                </div>
                            );
                        }
                        return <p key={lIdx} className="text-gray-600 leading-relaxed">{formatLineWithBold(trimmedLine)}</p>;
                    })}
                </div>
            );
        });
    };

    const formatLineWithBold = (line: string) => {
        const parts = line.split(/(\*\*.*?\*\*)/);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-black text-gray-900">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    if (authLoading || !user) return <div className="p-10 text-center">{t('common.loading')}</div>;

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-12">
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    <Sidebar />

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0 w-full">
                        {selectedNews ? (
                            /* DETAILED NEWS VIEW */
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* News Header */}
                                <div className="p-8 md:p-12 border-b bg-white">
                                    <button
                                        onClick={() => setSelectedNews(null)}
                                        className="mb-8 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:text-blue-800 transition-all hover:-translate-x-1"
                                    >
                                        ← {t('news.back_to_archive')}
                                    </button>

                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                        <div className="max-w-3xl">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">
                                                {formatDate(selectedNews.date)} • Exam Special
                                            </p>
                                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight uppercase tracking-tight">
                                                {selectedNews.name}
                                            </h2>
                                        </div>

                                        {selectedNews.fileUrl && (
                                            <div className="flex bg-gray-100 p-1.5 rounded-2xl shrink-0">
                                                <button
                                                    onClick={() => setViewMode('summary')}
                                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'summary' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    ✍️ Summary
                                                </button>
                                                <button
                                                    onClick={() => setViewMode('pdf')}
                                                    className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'pdf' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                                >
                                                    📄 Full Paper
                                                </button>
                                                <a
                                                    href={selectedNews.fileUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-4 py-2.5 rounded-xl text-xs font-black text-gray-400 hover:text-blue-600 transition-all flex items-center justify-center"
                                                    title="Open in New Tab"
                                                >
                                                    ↗️
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="p-8 md:p-12 bg-white">
                                    {viewMode === 'summary' ? (
                                        <div className="max-w-4xl mx-auto">
                                            {formatNewsContent(selectedNews.summary)}

                                            <div className="mt-16 p-8 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 flex flex-col md:flex-row items-center gap-6">
                                                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-blue-200">💡</div>
                                                <div>
                                                    <h4 className="font-black text-blue-900 uppercase text-sm tracking-widest mb-1">Study Advice</h4>
                                                    <p className="text-blue-700/80 font-medium">These topics are frequently asked in current affairs sections. Revise early morning for better retention!</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full aspect-[4/5] bg-gray-100 rounded-[2rem] overflow-hidden border">
                                            <iframe src={selectedNews.fileUrl} className="w-full h-full border-0" />
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 bg-gray-50 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">SarkariMinds Premium News Portal</p>
                                    <button
                                        onClick={() => window.print()}
                                        className="px-6 py-2 bg-white border border-gray-200 text-gray-900 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-sm"
                                    >
                                        🖨️ Save as PDF
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* ARCHIVE LIST VIEW */
                            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8 md:p-12">
                                <header className="mb-12">
                                    <div className="flex items-center gap-4 mb-2">
                                        <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full">Updates Daily</span>
                                    </div>
                                    <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
                                        Examiner's Choice News 📰
                                    </h1>
                                    <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-2 opacity-60">
                                        Handcrafted news summaries for top government exams
                                    </p>
                                </header>

                                {loading ? (
                                    <div className="py-20 flex flex-col items-center justify-center space-y-6">
                                        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('news.fetching')}</p>
                                    </div>
                                ) : newspapers.length === 0 ? (
                                    <div className="py-20 text-center bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                        <p className="text-3xl mb-4">📭</p>
                                        <h2 className="text-xl font-black text-gray-400 uppercase tracking-tight">No News Posted Yet</h2>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {newspapers.map((news) => (
                                            <div
                                                key={news._id}
                                                onClick={() => handleViewNews(news)}
                                                className="group cursor-pointer bg-white hover:bg-blue-50/30 border border-gray-100 hover:border-blue-200 rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-100/50 flex flex-col h-full"
                                            >
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-white group-hover:scale-110 transition-all duration-500 shadow-sm">
                                                        🗓️
                                                    </div>
                                                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                                        Read Story
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2 group-hover:text-blue-700 transition">
                                                    {news.name}
                                                </h3>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
                                                    {formatDate(news.date)}
                                                </p>

                                                <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                                                    <div className="flex -space-x-2">
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white"></div>
                                                        <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white"></div>
                                                        <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-400">
                                                            +{Math.floor(Math.random() * 90) + 10}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        Read by {news.views?.length || 0} students
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
