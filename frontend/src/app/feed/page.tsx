'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import StoryBar from '@/components/StoryBar';
import PostModal from '@/components/PostModal';
import PostCard from '@/components/PostCard';
import AdCard from '@/components/AdCard';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

import { useLanguage } from '@/context/LanguageContext';

export default function Feed() {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [feedAd, setFeedAd] = useState<any>(null);
    const [sidebarAd, setSidebarAd] = useState<any>(null);
    const [examNews, setExamNews] = useState<any[]>([]);
    const [selectedNews, setSelectedNews] = useState<any>(null);
    const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);
    const [selectedExams, setSelectedExams] = useState<string[]>([]);
    const [allExams, setAllExams] = useState<any[]>([]);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const { user, updateUser, logout, loading: authLoading } = useAuth();
    const { t, language } = useLanguage();
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
                // Prevent duplicate keys
                const uniquePosts = Array.from(new Map(data.map((item: any) => [item._id, item])).values());
                setPosts(uniquePosts);
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

    const fetchAllExams = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/exams');
            if (res.ok) setAllExams(await res.json());
        } catch (err) { console.error(err); }
    };

    useEffect(() => {
        if (user) {
            fetchPosts();
            fetchAds();
            fetchExamNews();
            fetchAllExams();
            setSelectedExams(user.preferredExams?.map((e: any) => e._id || e) || []);

            // Update last visit timestamp
            fetch('http://localhost:5000/api/posts/last-visit', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            }).then(() => {
                window.dispatchEvent(new Event('notificationsUpdated'));
            }).catch(console.error);
        }
    }, [user]);

    // Record view when a news item is selected
    useEffect(() => {
        if (selectedNews && user) {
            fetch(`http://localhost:5000/api/exam-news/${selectedNews._id}/view`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            })
                .then(res => res.json())
                .then(data => {
                    // Update views count for the selected news locally
                    if (data.viewsCount !== undefined) {
                        setExamNews(prev => prev.map(news =>
                            news._id === selectedNews._id
                                ? { ...news, views: new Array(data.viewsCount).fill(null) }
                                : news
                        ));
                    }
                })
                .catch(err => console.error('Failed to record view:', err));
        }
    }, [selectedNews, user]);

    const handleSavePrefs = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/exams/select', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ preferredExamIds: selectedExams })
            });

            if (res.status === 401) {
                alert(t('auth.session_expired'));
                logout();
                return;
            }

            if (res.ok) {
                const data = await res.json();
                updateUser({
                    preferredExams: data.preferredExams,
                    exams: data.exams,
                    examHashtags: data.examHashtags
                });
                setIsPrefModalOpen(false);
                setTimeout(() => fetchExamNews(), 500);
            } else {
                alert(t('auth.save_fail'));
            }
        } catch (err) {
            console.error('Failed to save preferences:', err);
            alert(t('auth.server_error'));
        }
    };

    if (authLoading || !user) return <div className="p-10 text-center">{t('common.loading')}</div>;

    const AD_EVERY_N_POSTS = 4;

    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + t('time.y') + " " + t('time.ago');
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + t('time.mo') + " " + t('time.ago');
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + t('time.d') + " " + t('time.ago');
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + t('time.h') + " " + t('time.ago');
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + t('time.m') + " " + t('time.ago');
        return Math.floor(seconds) + t('time.s') + " " + t('time.ago');
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
            <main className="max-w-7xl mx-auto px-6 pb-10 pt-6 flex flex-col md:flex-row gap-6">
                {/* Left Sidebar */}
                <div className="hidden md:block w-[280px] shrink-0">
                    <Sidebar />
                </div>

                {/* Feed Content */}
                <div className="flex-1 min-w-0 space-y-4">
                    <StoryBar />

                    {loading ? (
                        <div className="text-center py-10 text-gray-400">{t('common.loading')}</div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map((post: any, index: number) => (
                                <React.Fragment key={post._id}>
                                    <PostCard
                                        post={post}
                                        onDelete={(postId) => setPosts(prev => prev.filter(p => p._id !== postId))}
                                    />
                                    {feedAd && (index + 1) % AD_EVERY_N_POSTS === 0 && (
                                        <AdCard ad={feedAd} variant="feed" />
                                    )}
                                </React.Fragment>
                            ))}
                            {posts.length === 0 && (
                                <div className="bg-white border rounded-xl p-10 text-center text-gray-500">
                                    {t('common.no_posts')}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="hidden lg:block w-[280px] shrink-0">
                    <div className="bg-white border rounded-xl p-4 shadow-sm">
                        <header className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-gray-700">{t('sidebar.exam_news')}</h4>                           <span className="animate-pulse bg-red-500 w-2 h-2 rounded-full"></span>
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
                                                    {news.views?.length || 0} {news.views?.length === 1 ? t('news.reader') : t('news.readers')}
                                                </p>                                           </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="py-6 text-center">
                                    <p className="text-2xl mb-2">🗞️</p>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">{t('news.no_updates')}</p>
                                    <button
                                        onClick={() => setIsPrefModalOpen(true)}
                                        className="text-[10px] text-blue-600 font-black uppercase mt-2 hover:underline"
                                    >
                                        {t('news.edit_prefs')}
                                    </button>
                                </div>)}
                        </div>
                    </div>

                    <button
                        onClick={() => setIsPrefModalOpen(true)}
                        className="w-full mt-4 py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 transition"
                    >
                        ⚙️ {t('sidebar.update_prefs')}
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
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t('news.prefs_title')}</h2>
                                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{t('news.prefs_desc')}</p>
                            </div>
                            <button onClick={() => setIsPrefModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Your Target Exams</label>
                                <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {allExams.map(exam => (
                                        <label key={exam._id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${selectedExams.includes(exam._id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}>
                                            <input
                                                type="checkbox"
                                                checked={selectedExams.includes(exam._id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        if (selectedExams.length >= 5) return alert('Maximum 5 exams allowed');
                                                        setSelectedExams([...selectedExams, exam._id]);
                                                    }
                                                    else setSelectedExams(selectedExams.filter(id => id !== exam._id));
                                                }}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <span className="text-xs font-bold text-gray-700">{exam.name}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-400 italic">You will receive notifications for selected exams.</p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleSavePrefs}
                                    className="flex-1 px-6 py-4 bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-blue-500/20"
                                >
                                    {t('news.save_prefs')}
                                </button>
                                <button
                                    onClick={() => setIsPrefModalOpen(false)}
                                    className="px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200"
                                >
                                    {t('common.cancel')}
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
                                    <p className="text-xs text-gray-400 font-bold uppercase">{selectedNews.views?.length || 0} {selectedNews.views?.length === 1 ? t('news.reader') : t('news.readers')}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedNews(null)} className="text-gray-400 hover:text-gray-600 text-2xl p-2 bg-white rounded-full shadow-sm">✕</button>
                        </div>
                        <div className="p-8">
                            <div className="prose prose-blue max-w-none text-gray-700 font-medium whitespace-pre-line leading-relaxed text-lg">
                                {renderDescription(selectedNews.description)}
                            </div>
                            <div className="mt-10 pt-8 border-t border-gray-100 flex justify-between items-center">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{t('news.official_update')}</p>
                                <button
                                    onClick={() => setSelectedNews(null)}
                                    className="px-8 py-3 bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-blue-500/20"
                                >
                                    {t('news.close')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
