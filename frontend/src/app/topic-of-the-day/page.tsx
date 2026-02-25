'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { API_BASE_URL } from '@/config';
import { FiLayers } from 'react-icons/fi';
import PostCard from '@/components/PostCard';

export default function TopicOfTheDayPage() {
    const { user, loading: authLoading } = useAuth();
    const { t } = useLanguage();
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchPosts();
        }
    }, [user]);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/topic-of-the-day`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setPosts(data);
            }
        } catch (error) {
            console.error('Failed to fetch topic of the day posts:', error);
        } finally {
            setLoading(false);
        }
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
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                                <FiLayers size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">
                                    Topic <span className="text-indigo-700">Of The Day</span>
                                </h1>
                                <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest mt-2">
                                    Daily Insights • Detailed Analysis • Expert Perspectives
                                </p>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[4rem] -mr-4 -mt-4 opacity-50"></div>
                    </div>

                    {/* Content List */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-400 font-bold uppercase text-xs tracking-widest">{t('common.loading')}</div>
                    ) : posts.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                            <div className="text-4xl mb-3">📚</div>
                            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No topics posted yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {posts.map(post => (
                                <PostCard key={post._id} post={post} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
