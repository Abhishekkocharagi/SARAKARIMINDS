'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import StoryBar from '@/components/StoryBar';
import PostBox from '@/components/PostBox';
import PostCard from '@/components/PostCard';
import AdCard from '@/components/AdCard';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Feed() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [feedAd, setFeedAd] = useState<any>(null);
    const [sidebarAd, setSidebarAd] = useState<any>(null);
    const [examNews, setExamNews] = useState<any[]>([]);
    const [selectedNews, setSelectedNews] = useState<any>(null);
    const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);
    const [prefHashtags, setPrefHashtags] = useState('');
    const { user, updateUser, logout, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const fetchAds = async () => {
        try {
            // Fetch Feed Ad
            const fRes = await fetch('http://localhost:5000/api/ads/slot/FEED_INLINE');
            if (fRes.ok) setFeedAd(await fRes.json());

            // Fetch Sidebar Ad
            const sRes = await fetch('http://localhost:5000/api/ads/slot/SIDEBAR_EXAM');
            if (sRes.ok) setSidebarAd(await sRes.json());
        } catch (err) {
            console.error('Failed to fetch ads:', err);
        }
    };

    const fetchExamNews = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/exam-news', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setExamNews(data);

                // Record views for each news item displayed
                data.forEach((item: any) => {
                    fetch(`http://localhost:5000/api/exam-news/${item._id}/view`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${user?.token}` }
                    }).catch(err => console.error('Failed to record view:', err));
                });
            }
        } catch (err) {
            console.error('Failed to fetch exam news:', err);
        }
    };

    const fetchPosts = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/posts', {
                headers: {
                    'Authorization': `Bearer ${user?.token}`
                }
            });

            if (res.status === 401) {
                // Token expired or invalid - logout user
                console.error('Authentication failed - logging out');
                logout();
                return;
            }

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();

            // Ensure data is an array before setting state
            if (Array.isArray(data)) {
                setPosts(data);
            } else {
                console.error('API returned non-array data:', data);
                setPosts([]);
            }
        } catch (err) {
            console.error('Error fetching posts:', err);
            setPosts([]); // Ensure posts is always an array
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchPosts();
            fetchAds();
            fetchExamNews();
            setPrefHashtags(user.examHashtags?.join(', ') || '');
        }
    }, [user]);

    const handleSavePrefs = async () => {
        const hashtagsArray = prefHashtags.split(',').map(tag => {
            const trimmed = tag.trim();
            if (!trimmed) return null;
            return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
        }).filter(Boolean);

        try {
            const res = await fetch('http://localhost:5000/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ examHashtags: hashtagsArray })
            });

            if (res.status === 401) {
                alert('Your session has expired. Please log in again.');
                logout();
                return;
            }

            if (res.ok) {
                const updatedUser = await res.json();
                updateUser({ examHashtags: updatedUser.examHashtags });
                setIsPrefModalOpen(false);
                setTimeout(() => fetchExamNews(), 500); // Small delay to ensure DB propagation
            } else {
                alert('Failed to save preferences. Please try again.');
            }
        } catch (err) {
            console.error('Failed to save preferences:', err);
            alert('Cannot connect to server. Please check if the backend is running on http://localhost:5000');
        }
    };

    if (authLoading || !user) return <div className="p-10 text-center">Loading community...</div>;

    const AD_EVERY_N_POSTS = 4;

    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return Math.floor(seconds) + "s ago";
    };

    // Helper to render text with links
    const renderDescription = (text: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.split(urlRegex).map((part, i) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={i}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all font-bold"
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left Sidebar */}
                <div className="md:col-span-3 hidden md:block">
                    <Sidebar />
                </div>

                {/* Feed Content */}
                <div className="md:col-span-6 space-y-4">
                    <StoryBar />
                    <PostBox refreshPosts={fetchPosts} />

                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Loading posts...</div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map((post: any, index: number) => (
                                <React.Fragment key={post._id}>
                                    <PostCard post={post} />
                                    {feedAd && (index + 1) % AD_EVERY_N_POSTS === 0 && (
                                        <AdCard ad={feedAd} variant="feed" />
                                    )}
                                </React.Fragment>
                            ))}
                            {posts.length === 0 && (
                                <div className="bg-white border rounded-xl p-10 text-center text-gray-500">
                                    No posts yet. Be the first to share an update!
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="md:col-span-3 hidden md:block">
                    <div className="bg-white border rounded-xl p-4 shadow-sm">
                        <header className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-gray-700">Exam News (Karnataka)</h4>
                            <span className="animate-pulse bg-red-500 w-2 h-2 rounded-full"></span>
                        </header>

                        <div className="space-y-4">
                            {examNews.length > 0 ? (
                                <ul className="space-y-4 text-sm max-h-[300px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
                                    {examNews.map((news) => (
                                        <li
                                            key={news._id}
                                            onClick={() => setSelectedNews(news)}
                                            className="group cursor-pointer border-b border-gray-50 pb-3 last:border-0 last:pb-0"
                                        >
                                            <p className="font-bold text-gray-800 group-hover:text-blue-700 transition line-clamp-2 leading-tight">
                                                {news.title}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-[10px] text-gray-400 font-bold uppercase" title={new Date(news.createdAt).toLocaleString()}>
                                                    {timeAgo(news.createdAt)}
                                                </p>
                                                <span className="text-[10px] text-gray-300">•</span>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase">
                                                    {news.views?.length || 0} {news.views?.length === 1 ? 'reader' : 'readers'}
                                                </p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="py-6 text-center">
                                    <p className="text-2xl mb-2">🗞️</p>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">No exam updates for your selected exams</p>
                                    <button
                                        onClick={() => setIsPrefModalOpen(true)}
                                        className="text-[10px] text-blue-600 font-black uppercase mt-2 hover:underline"
                                    >
                                        Edit Preferences
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setIsPrefModalOpen(true)}
                        className="w-full mt-4 py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 transition"
                    >
                        ⚙️ Update Exam Preferences
                    </button>

                    {/* Sponsored Section */}
                    {sidebarAd && <AdCard ad={sidebarAd} variant="sidebar" />}
                </div>
            </main>

            {/* Preferences Modal */}
            {isPrefModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Exam Preferences</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Select your exam hashtags</p>
                            </div>
                            <button onClick={() => setIsPrefModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Exam Hashtags</label>
                                <input
                                    type="text"
                                    value={prefHashtags}
                                    onChange={(e) => setPrefHashtags(e.target.value)}
                                    placeholder="e.g. KPSCKAS, FDA, PSI"
                                    className="w-full px-4 py-4 bg-gray-50 border rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none transition"
                                />
                                <p className="text-[10px] text-gray-400 italic">Separate hashtags with commas. We will prefix # automatically.</p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleSavePrefs}
                                    className="flex-1 px-6 py-4 bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-blue-500/20"
                                >
                                    Save & Update Feed
                                </button>
                                <button
                                    onClick={() => setIsPrefModalOpen(false)}
                                    className="px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Detailed News Modal */}
            {selectedNews && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b flex justify-between items-start bg-gray-50">
                            <div className="space-y-2">
                                <div className="flex gap-2">
                                    {selectedNews.hashtags?.map((tag: string, i: number) => (
                                        <span key={i} className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 leading-tight uppercase tracking-tight">
                                    {selectedNews.title}
                                </h2>
                                <div className="flex items-center gap-3">
                                    <p className="text-xs text-gray-400 font-bold uppercase">{timeAgo(selectedNews.createdAt)}</p>
                                    <span className="text-gray-300">•</span>
                                    <p className="text-xs text-gray-400 font-bold uppercase">{selectedNews.views?.length || 0} Readers</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedNews(null)} className="text-gray-400 hover:text-gray-600 text-2xl p-2 bg-white rounded-full shadow-sm">✕</button>
                        </div>
                        <div className="p-8">
                            <div className="prose prose-blue max-w-none text-gray-700 font-medium whitespace-pre-line leading-relaxed text-lg">
                                {renderDescription(selectedNews.description)}
                            </div>
                            <div className="mt-10 pt-8 border-t border-gray-100 flex justify-between items-center">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Official Update • SarkariMinds Team</p>
                                <button
                                    onClick={() => setSelectedNews(null)}
                                    className="px-8 py-3 bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-blue-500/20"
                                >
                                    Close Update
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
