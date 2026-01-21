'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function DailyNewspaperPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [newspapers, setNewspapers] = useState<any[]>([]);
    const [selectedNewspaper, setSelectedNewspaper] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);

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
            const res = await fetch('http://localhost:5000/api/daily-newspapers', {
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

    const handleViewNewspaper = async (newspaper: any) => {
        setSelectedNewspaper(newspaper);

        // Record view
        try {
            await fetch(`http://localhost:5000/api/daily-newspapers/${newspaper._id}/view`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            // Update local state views count
            setNewspapers(prev => prev.map(n =>
                n._id === newspaper._id
                    ? { ...n, views: n.views?.includes(user?._id) ? n.views : [...(n.views || []), user?._id] }
                    : n
            ));
        } catch (error) {
            console.error('Failed to record view:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Grouping by date
    const groupedNewspapers = newspapers.reduce((groups: any, newspaper: any) => {
        const date = new Date(newspaper.date).toDateString();
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(newspaper);
        return groups;
    }, {});

    // Sort dates (Latest first)
    const sortedDates = Object.keys(groupedNewspapers).sort((a, b) => {
        return new Date(b).getTime() - new Date(a).getTime();
    });

    if (authLoading || !user) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div className="min-h-screen bg-[#F3F2EF] overflow-x-hidden">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 h-[calc(100vh-80px)] overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full relative">
                    {/* Left Sidebar - Always visible on desktop */}
                    <div className="md:col-span-3 hidden md:block h-full">
                        <Sidebar />
                    </div>

                    {/* Content Area with Sliding panels */}
                    <div className="md:col-span-9 h-full relative overflow-hidden bg-white border rounded-[2.5rem] shadow-sm">

                        {/* Slide 1: Archive List */}
                        <div className={`absolute inset-0 p-4 md:p-8 transition-all duration-700 ease-in-out transform flex flex-col ${selectedNewspaper ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'
                            }`}>
                            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 shrink-0">
                                <div>
                                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                                        <span className="text-4xl">📰</span>
                                        Daily Archive
                                    </h1>
                                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-1">
                                        Admin uploaded newspapers
                                    </p>
                                </div>
                                <div className="bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                                    <span className="text-blue-700 font-black text-xs uppercase tracking-widest">
                                        {newspapers.length} Papers
                                    </span>
                                </div>
                            </header>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                {loading ? (
                                    <div className="py-20 flex flex-col items-center justify-center space-y-4">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
                                        <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Fetching papers...</p>
                                    </div>
                                ) : newspapers.length === 0 ? (
                                    <div className="py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed">
                                        <h2 className="text-xl font-bold text-gray-600">No newspapers found</h2>
                                    </div>
                                ) : (
                                    <div className="space-y-10">
                                        {sortedDates.map(date => (
                                            <section key={date}>
                                                <div className="flex items-center gap-4 mb-6">
                                                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] whitespace-nowrap">
                                                        {formatDate(date)}
                                                    </h3>
                                                    <div className="h-[1px] bg-gray-100 w-full"></div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    {groupedNewspapers[date].map((newspaper: any) => (
                                                        <div
                                                            key={newspaper._id}
                                                            onClick={() => handleViewNewspaper(newspaper)}
                                                            className="group cursor-pointer bg-gray-50/50 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl px-5 py-3 transition-all duration-200 flex items-center justify-between"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl group-hover:bg-white transition-colors">
                                                                    📰
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition text-base">
                                                                        {newspaper.name}
                                                                    </h4>
                                                                    <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mt-0.5">
                                                                        {formatDate(newspaper.date)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">
                                                                    {newspaper.views?.length || 0} Readers
                                                                </span>
                                                                <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-all transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Slide 2: Viewer Panel */}
                        <div className={`absolute inset-0 bg-white transition-all duration-700 ease-in-out transform flex flex-col ${selectedNewspaper ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 shadow-2xl'
                            }`}>
                            {selectedNewspaper && (
                                <>
                                    <div className="px-6 py-4 border-b flex justify-between items-center bg-white shrink-0">
                                        <div>
                                            <button
                                                onClick={() => setSelectedNewspaper(null)}
                                                className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-all mb-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                                                </svg>
                                                Back to Archive
                                            </button>
                                            <h2 className="text-xl font-black text-gray-900 leading-tight uppercase tracking-tight line-clamp-1">
                                                {selectedNewspaper.name}
                                            </h2>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest hidden sm:block">
                                                {formatDate(selectedNewspaper.date)}
                                            </span>
                                            <button
                                                onClick={() => setSelectedNewspaper(null)}
                                                className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex-1 bg-gray-50 flex items-center justify-center p-2 md:p-4 overflow-hidden">
                                        {selectedNewspaper.fileType === 'pdf' ? (
                                            <div className="w-full h-full bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
                                                <iframe
                                                    src={selectedNewspaper.fileUrl}
                                                    className="w-full h-full border-0"
                                                    title={selectedNewspaper.name}
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full overflow-auto flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100">
                                                <img
                                                    src={selectedNewspaper.fileUrl}
                                                    alt={selectedNewspaper.name}
                                                    className="max-w-full max-h-full object-contain p-4"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="px-6 py-4 border-t bg-white flex justify-between items-center shrink-0">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em]">
                                            SarkariMinds Digital Preview
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setIsFullScreen(true)}
                                                className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"
                                            >
                                                <span className="text-lg">⛶</span> Full Screen
                                            </button>
                                            <a
                                                href={selectedNewspaper.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-6 py-2 bg-gray-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all"
                                            >
                                                Open Original
                                            </a>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Full Screen Overlay */}
            {isFullScreen && selectedNewspaper && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in zoom-in duration-300">
                    <div className="px-6 py-4 border-b flex justify-between items-center bg-white shrink-0 shadow-sm">
                        <div className="flex items-center gap-4">
                            <span className="text-2xl">📰</span>
                            <div>
                                <h2 className="text-xl font-black text-gray-900 leading-tight uppercase tracking-tight">
                                    {selectedNewspaper.name}
                                </h2>
                                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-[0.2em]">
                                    Direct Reading Mode
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsFullScreen(false)}
                            className="px-8 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-700 transition-all flex items-center gap-2 shadow-lg hover:shadow-red-200"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                            </svg>
                            Go Back
                        </button>
                    </div>
                    <div className="flex-1 bg-gray-100 overflow-hidden">
                        {selectedNewspaper.fileType === 'pdf' ? (
                            <iframe
                                src={selectedNewspaper.fileUrl}
                                className="w-full h-full border-0"
                                title={selectedNewspaper.name}
                            />
                        ) : (
                            <div className="w-full h-full overflow-auto flex items-center justify-center p-8">
                                <img
                                    src={selectedNewspaper.fileUrl}
                                    alt={selectedNewspaper.name}
                                    className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
