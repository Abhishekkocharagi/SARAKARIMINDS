'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import PostCard from '@/components/PostCard';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface UserProfile {
    _id: string;
    name: string;
    email: string;
    accountType: string;
    about: string;
    profilePic: string;
    coverPic: string;
    exams: string[];
    connections: any[];
    followers: any[];
    following: any[];
    connectionStatus: 'none' | 'pending' | 'accepted' | 'rejected';
    isRequester: boolean;
    requestId: string | null;
}

export default function ProfilePage() {
    const { id } = useParams();
    const router = useRouter();
    const { user: currentUser, updateUser, logout } = useAuth();

    // Derived state for self-profile check
    const isSelf = currentUser?._id === (Array.isArray(id) ? id[0] : id);

    const { t } = useLanguage();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        about: '',
        profilePic: '',
        coverPic: '',
        profileFile: null as File | null,
        coverFile: null as File | null,
        preferredExams: [] as string[]
    });
    const [allExams, setAllExams] = useState<any[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const [savedPosts, setSavedPosts] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');

    const fetchProfile = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/users/${id}`, {
                headers: { 'Authorization': `Bearer ${currentUser?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);

                // Sync with AuthContext if it's the current user
                if (currentUser?._id === data._id) {
                    updateUser({
                        name: data.name,
                        profilePic: data.profilePic,
                        coverPic: data.coverPic,
                        about: data.about,
                        connectionsCount: data.connections?.length || 0,
                        followersCount: data.followers?.length || 0,
                        followingCount: data.following?.length || 0,
                        // savedPosts count not in user model explicitly for context, but fetched separately
                    });
                }

                setEditForm({
                    name: data.name,
                    about: data.about || '',
                    profilePic: data.profilePic || '',
                    coverPic: data.coverPic || '',
                    profileFile: null,
                    coverFile: null,
                    preferredExams: data.preferredExams?.map((e: any) => e._id || e) || []
                });
                setIsFollowing(data.followers.some((f: any) => f._id === currentUser?._id));
            } else {
                router.push('/feed');
            }
        } catch (err) { console.error(err); }
    };

    const fetchPosts = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/posts/user/${id}`, {
                headers: { 'Authorization': `Bearer ${currentUser?.token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setPosts(data);
        } catch (err) { console.error(err); }
    };

    const fetchSavedPosts = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/posts/saved/all', {
                headers: { 'Authorization': `Bearer ${currentUser?.token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setSavedPosts(data);
        } catch (err) { console.error(err); }
    };

    const fetchAllExams = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/exams');
            if (res.ok) setAllExams(await res.json());
        } catch (err) { console.error(err); }
    };

    const loadPage = async () => {
        setLoading(true);
        const promises = [fetchProfile(), fetchPosts(), fetchAllExams()];

        // Check if loading own profile, then fetch saved items
        // Since 'id' is from params and currentUser might not be synced yet, check safely
        if (currentUser && currentUser._id === id) {
            promises.push(fetchSavedPosts());
        }

        await Promise.all(promises);
        setLoading(false);
    };

    useEffect(() => {
        if (currentUser?.token && id) loadPage();
    }, [id, currentUser?.token]);

    const handleConnect = async () => {
        if (!profile) return;
        try {
            const res = await fetch('http://localhost:5000/api/connections/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser?.token}`
                },
                body: JSON.stringify({ recipientId: profile._id })
            });
            if (res.ok) fetchProfile();
        } catch (err) { console.error(err); }
    };

    const handleAcceptRequest = async () => {
        if (!profile || !profile.requestId) return;
        try {
            const res = await fetch('http://localhost:5000/api/connections/respond', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser?.token}`
                },
                body: JSON.stringify({ requestId: profile.requestId, status: 'accepted' })
            });
            if (res.ok) fetchProfile();
        } catch (err) { console.error(err); }
    };

    const handleWithdraw = async () => {
        if (!profile || !profile.requestId) return;
        if (!confirm('Are you sure you want to withdraw this connection request?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/connections/withdraw/${profile.requestId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentUser?.token}` }
            });
            if (res.ok) fetchProfile();
        } catch (err) { console.error(err); }
    };

    const handleToggleFollow = async () => {
        if (!profile) return;
        try {
            const res = await fetch(`http://localhost:5000/api/users/${profile._id}/follow`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${currentUser?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setIsFollowing(data.isFollowing);
                fetchProfile();
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteAccount = async () => {
        if (!confirm(t('profile.delete_confirm'))) return;

        try {
            const res = await fetch('http://localhost:5000/api/users/profile', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentUser?.token}` }
            });
            if (res.ok) {
                alert(t('profile.delete_success'));
                logout();
            } else {
                alert(t('profile.delete_failed'));
            }
        } catch (err) { console.error(err); }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData();
        formData.append('name', editForm.name);
        formData.append('about', editForm.about);
        if (editForm.profileFile) formData.append('profilePic', editForm.profileFile);
        if (editForm.coverFile) formData.append('coverPic', editForm.coverFile);

        try {
            // First update general profile
            const res = await fetch('http://localhost:5000/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${currentUser?.token}`
                },
                body: formData
            });

            // Then update exams (using the new endpoint)
            const examRes = await fetch('http://localhost:5000/api/exams/select', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser?.token}`
                },
                body: JSON.stringify({ preferredExamIds: editForm.preferredExams })
            });

            if (res.ok && examRes.ok) {
                const data = await res.json();
                const examData = await examRes.json();
                updateUser({
                    name: data.name,
                    profilePic: data.profilePic,
                    coverPic: data.coverPic,
                    about: data.about,
                    preferredExams: examData.preferredExams,
                    exams: examData.preferredExams.map((e: any) => e.name)
                });
                setIsEditing(false);
                fetchProfile();
                alert(t('profile.update_success'));
            } else {
                const errorData = await res.json();
                alert(`${t('profile.update_failed')} ${errorData.message}`);
            }
        } catch (err) {
            console.error(err);
            alert(t('profile.update_error'));
        } finally {
            setIsSaving(false);
        }
    };

    if (loading && !profile) return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <div className="pt-32 text-center text-gray-400 font-black uppercase tracking-widest animate-pulse">{t('profile.loading')}</div>
        </div>
    );

    if (!profile) return null;



    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto pt-6 px-6 pb-10 flex flex-col md:flex-row gap-6">
                <div className="hidden md:block w-[280px] shrink-0">
                    <Sidebar />
                </div>

                <div className="flex-1 space-y-6">
                    {/* Profile Header */}
                    <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
                        <div className="h-52 md:h-72 bg-gray-200 relative group">
                            {profile.coverPic ? (
                                <img src={profile.coverPic} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#3949ab]">
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                                </div>
                            )}
                            {isSelf && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        <div className="px-8 pb-8">
                            <div className="relative flex justify-between items-end -mt-16 mb-6">
                                <div className="p-1.5 bg-white rounded-full shadow-2xl relative group">
                                    <div className="w-36 h-36 rounded-full bg-blue-50 flex items-center justify-center text-5xl font-black text-blue-800 uppercase overflow-hidden border-8 border-white">
                                        {profile.profilePic ? <img src={profile.profilePic} className="w-full h-full object-cover" /> : profile.name.charAt(0)}
                                    </div>
                                    {isSelf && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                <div className="flex space-x-3 mb-2">
                                    {isSelf ? (
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95"
                                            >
                                                {t('profile.edit')}
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handleToggleFollow}
                                                className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isFollowing ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-700 border-2 border-blue-200'}`}
                                            >
                                                {isFollowing ? t('profile.following') : t('profile.follow')}
                                            </button>

                                            {profile.connectionStatus === 'accepted' ? (
                                                <Link href={`/messages?user=${profile._id}`} className="px-6 py-2.5 bg-blue-700 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">
                                                    {t('profile.message')}
                                                </Link>
                                            ) : profile.connectionStatus === 'pending' ? (
                                                <div className="flex gap-2">
                                                    {!profile.isRequester ? (
                                                        <button
                                                            onClick={handleAcceptRequest}
                                                            className="px-6 py-2.5 bg-green-600 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-black shadow-lg active:scale-95 transition-all"
                                                        >
                                                            {t('profile.accept')}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={handleWithdraw}
                                                            className="px-6 py-2.5 bg-red-50 text-red-600 rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95 border-2 border-red-100"
                                                        >
                                                            {t('network.withdraw')}
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={handleConnect}
                                                    className="px-6 py-2.5 bg-blue-700 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                                                >
                                                    {t('profile.connect')}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                                        {profile.name}
                                        {['mentor', 'academy'].includes((profile as any).role || '') && (
                                            <span className="text-blue-500" title="Verified">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                                    <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.491 4.491 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                                </svg>
                                            </span>
                                        )}
                                    </h1>
                                    <span className="bg-blue-100 text-blue-700 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">{profile.accountType === 'Aspirant' ? t('sidebar.aspirant') : profile.accountType}</span>
                                </div>
                                <p className="text-gray-600 font-medium whitespace-pre-line text-sm max-w-lg">
                                    {profile.about || t('profile.default_about')}
                                </p>
                            </div>

                            <div className="mt-6 flex items-center space-x-6">
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-gray-900">{profile.connections?.length || 0}</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('profile.connections')}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-gray-900">{profile.followers?.length || 0}</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('profile.followers')}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-gray-900">{profile.following?.length || 0}</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{t('profile.following_count')}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                                <div className="p-6 border-b flex justify-between items-center">
                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{t('profile.edit')}</h2>
                                    <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('profile.label.name')}</label>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-bold focus:border-blue-600 outline-none transition"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('profile.label.bio')}</label>
                                        <textarea
                                            value={editForm.about}
                                            onChange={(e) => setEditForm({ ...editForm, about: e.target.value })}
                                            rows={3}
                                            placeholder={t('profile.bio_placeholder')}
                                            className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-medium focus:border-blue-600 outline-none transition resize-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('profile.label.profile_photo')}</label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setEditForm({ ...editForm, profileFile: e.target.files?.[0] || null })}
                                                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('profile.label.cover_photo')}</label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => setEditForm({ ...editForm, coverFile: e.target.files?.[0] || null })}
                                                    className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4 pt-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Target Exams</label>
                                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                            {allExams.map(exam => (
                                                <label key={exam._id} className={`flex items-center gap-2 p-2 border rounded-xl cursor-pointer transition ${editForm.preferredExams.includes(exam._id) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={editForm.preferredExams.includes(exam._id)}
                                                        onChange={(e) => {
                                                            const newExams = e.target.checked
                                                                ? [...editForm.preferredExams, exam._id]
                                                                : editForm.preferredExams.filter((id: string) => id !== exam._id);
                                                            if (newExams.length > 5) return alert('Maximum 5 exams allowed');
                                                            setEditForm({ ...editForm, preferredExams: newExams });
                                                        }}
                                                        className="w-3 h-3 text-blue-600 rounded"
                                                    />
                                                    <span className="text-[10px] font-bold text-gray-700">{exam.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="pt-4 flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-200"
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="flex-1 px-6 py-3 bg-blue-700 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                        >
                                            {isSaving ? t('profile.saving') : t('profile.save_changes')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Target Exams */}
                    <div className="bg-white rounded-2xl border shadow-sm p-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{t('profile.targeting_exams')}</h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.exams.length > 0 ? profile.exams.map(exam => (
                                <span key={exam} className="px-4 py-2 bg-gray-50 border rounded-xl text-xs font-bold text-gray-700 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                                    {exam}
                                </span>
                            )) : (
                                <p className="text-xs text-gray-400 italic">{t('profile.no_exams')}</p>
                            )}
                        </div>
                    </div>

                    {/* Posts Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2 border-b border-gray-100 pb-2 mb-4">
                            <div className="flex gap-6">
                                <button
                                    onClick={() => setActiveTab('posts')}
                                    className={`text-xs font-black uppercase tracking-[0.2em] pb-2 transition-all ${activeTab === 'posts' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {t('profile.activity')} ({posts.length})
                                </button>
                                {isSelf && (
                                    <button
                                        onClick={() => setActiveTab('saved')}
                                        className={`text-xs font-black uppercase tracking-[0.2em] pb-2 transition-all ${activeTab === 'saved' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        Saved ({savedPosts.length})
                                    </button>
                                )}
                            </div>
                        </div>

                        {activeTab === 'posts' ? (
                            posts.length > 0 ? (
                                posts.map((post: any) => (
                                    <PostCard
                                        key={post._id}
                                        post={post}
                                        showDelete={isSelf}
                                        onDelete={(postId) => setPosts(prev => prev.filter(p => p._id !== postId))}
                                    />
                                ))
                            ) : (
                                <div className="bg-white rounded-2xl border p-20 text-center">
                                    <p className="text-sm font-black text-gray-300 uppercase tracking-widest italic">{t('profile.no_activity')}</p>
                                </div>
                            )
                        ) : (
                            savedPosts.length > 0 ? (
                                savedPosts.map((post: any) => (
                                    <PostCard
                                        key={post._id}
                                        post={post}
                                        showDelete={isSelf}
                                        onDelete={(postId) => {
                                            // Handle delete/unsave if needed
                                        }}
                                    />
                                ))
                            ) : (
                                <div className="bg-white rounded-2xl border p-20 text-center">
                                    <p className="text-sm font-black text-gray-300 uppercase tracking-widest italic">No saved posts yet</p>
                                </div>
                            )
                        )}
                    </div>

                    {/* Account Management (Self Only) */}
                    {isSelf && (
                        <div className="pt-10 pb-6 border-t border-gray-200">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">{t('profile.account_settings')}</h3>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={logout}
                                    className="w-full sm:w-auto px-8 py-3 bg-white border-2 border-red-100 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95"
                                >
                                    {t('profile.logout')}
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-red-200"
                                >
                                    {t('profile.delete_account')}
                                </button>
                            </div>
                            <p className="mt-4 text-[10px] text-gray-400 text-center font-bold uppercase tracking-widest opacity-50">
                                {t('profile.delete_warning')}
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
