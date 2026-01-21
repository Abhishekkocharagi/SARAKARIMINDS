'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function DailyNewspaperSection() {
    const { user } = useAuth();
    const [newspapers, setNewspapers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedNewspaper, setSelectedNewspaper] = useState<any>(null);

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

    if (loading) {
        return (
            <div className="bg-white border rounded-xl p-4 shadow-sm">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-24 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (newspapers.length === 0) {
        return null; // Don't show section if no newspapers
    }

    return (
        <>
            <div className="bg-white border rounded-xl p-4 shadow-sm">
                <header className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-gray-700 flex items-center gap-2">
                        <span>📰</span>
                        Daily Newspaper
                    </h4>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {newspapers.length} Available
                    </span>
                </header>

                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {newspapers.slice(0, 5).map((newspaper) => (
                        <div
                            key={newspaper._id}
                            onClick={() => handleViewNewspaper(newspaper)}
                            className="group cursor-pointer border border-gray-100 rounded-xl p-3 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                        >
                            <div className="flex gap-3">
                                {/* Thumbnail */}
                                <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                                    {newspaper.fileType === 'image' ? (
                                        <img
                                            src={newspaper.fileUrl}
                                            alt={newspaper.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : newspaper.thumbnailUrl ? (
                                        <img
                                            src={newspaper.thumbnailUrl}
                                            alt={newspaper.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">
                                            📄
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-gray-800 group-hover:text-blue-700 transition line-clamp-2 leading-tight">
                                        {newspaper.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-gray-500 font-medium">
                                            {formatDate(newspaper.date)}
                                        </p>
                                        <span className="text-xs text-gray-300">•</span>
                                        <span className={`text-xs font-bold uppercase ${newspaper.fileType === 'pdf' ? 'text-red-600' : 'text-blue-600'
                                            }`}>
                                            {newspaper.fileType}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {newspaper.views?.length || 0} {newspaper.views?.length === 1 ? 'view' : 'views'}
                                    </p>
                                </div>

                                {/* Arrow */}
                                <div className="flex items-center text-gray-400 group-hover:text-blue-600 transition">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {newspapers.length > 5 && (
                    <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-center text-gray-400 font-bold">
                            Showing 5 of {newspapers.length} newspapers
                        </p>
                    </div>
                )}
            </div>

            {/* Viewer Modal */}
            {selectedNewspaper && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b flex justify-between items-start bg-gray-50">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedNewspaper.fileType === 'pdf'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-blue-100 text-blue-700'
                                        }`}>
                                        {selectedNewspaper.fileType}
                                    </span>
                                    <span className="text-xs text-gray-400 font-medium">
                                        {formatDate(selectedNewspaper.date)}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 leading-tight">
                                    {selectedNewspaper.name}
                                </h2>
                                <p className="text-xs text-gray-400 mt-1">
                                    {selectedNewspaper.views?.length || 0} views
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedNewspaper(null)}
                                className="text-gray-400 hover:text-gray-600 text-2xl p-2 bg-white rounded-full shadow-sm ml-4"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-auto bg-gray-100 p-6">
                            {selectedNewspaper.fileType === 'pdf' ? (
                                <div className="w-full h-full bg-white rounded-xl shadow-lg overflow-hidden">
                                    <iframe
                                        src={selectedNewspaper.fileUrl}
                                        className="w-full h-full"
                                        title={selectedNewspaper.name}
                                    />
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <img
                                        src={selectedNewspaper.fileUrl}
                                        alt={selectedNewspaper.name}
                                        className="max-w-full max-h-full object-contain rounded-xl shadow-lg"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Daily Newspaper • SarkariMinds
                            </p>
                            <div className="flex gap-3">
                                <a
                                    href={selectedNewspaper.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg"
                                >
                                    Open in New Tab
                                </a>
                                <button
                                    onClick={() => setSelectedNewspaper(null)}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-300 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
