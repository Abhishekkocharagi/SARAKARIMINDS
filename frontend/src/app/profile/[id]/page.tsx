'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import PostCard from '@/components/PostCard';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { API_BASE_URL } from '@/config';

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
    const [showListModal, setShowListModal] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalList, setModalList] = useState<any[]>([]);

    const fetchProfile = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
                headers: { 'Authorization': `Bearer ${currentUser?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
                if (currentUser?._id === data._id) {
                    updateUser({
                        name: data.name,
                        profilePic: data.profilePic,
                        coverPic: data.coverPic,
                        about: data.about,
                        connectionsCount: data.connections?.length || 0,
                        followersCount: data.followers?.length || 0,
                        followingCount: data.following?.length || 0,
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
            } else { router.push('/feed'); }
        } catch (err) { console.error(err); }
    };

    const fetchPosts = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/posts/user/${id}`, {
                headers: { 'Authorization': `Bearer ${currentUser?.token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setPosts(data);
        } catch (err) { console.error(err); }
    };

    const fetchSavedPosts = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/posts/saved/all`, {
                headers: { 'Authorization': `Bearer ${currentUser?.token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) setSavedPosts(data);
        } catch (err) { console.error(err); }
    };

    const fetchAllExams = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/exams`);
            if (res.ok) setAllExams(await res.json());
        } catch (err) { console.error(err); }
    };

    const loadPage = async () => {
        setLoading(true);
        const promises = [fetchProfile(), fetchPosts(), fetchAllExams()];
        if (currentUser && currentUser._id === id) { promises.push(fetchSavedPosts()); }
        await Promise.all(promises);
        setLoading(false);
    };

    useEffect(() => {
        if (currentUser?.token && id) loadPage();
    }, [id, currentUser?.token]);

    const handleConnect = async () => {
        if (!profile) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/connections/request`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentUser?.token}` },
                body: JSON.stringify({ recipientId: profile._id })
            });
            if (res.ok) fetchProfile();
        } catch (err) { console.error(err); }
    };

    const handleAcceptRequest = async () => {
        if (!profile || !profile.requestId) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/connections/respond`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentUser?.token}` },
                body: JSON.stringify({ requestId: profile.requestId, status: 'accepted' })
            });
            if (res.ok) fetchProfile();
        } catch (err) { console.error(err); }
    };

    const handleWithdraw = async () => {
        if (!profile || !profile.requestId) return;
        if (!confirm('Are you sure you want to withdraw this connection request?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/connections/withdraw/${profile.requestId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentUser?.token}` }
            });
            if (res.ok) fetchProfile();
        } catch (err) { console.error(err); }
    };

    const handleToggleFollow = async () => {
        if (!profile) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/users/${profile._id}/follow`, {
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
            const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentUser?.token}` }
            });
            if (res.ok) {
                alert(t('profile.delete_success'));
                logout();
            } else { alert(t('profile.delete_failed')); }
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
            const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${currentUser?.token}` },
                body: formData
            });

            const examRes = await fetch(`${API_BASE_URL}/api/exams/select`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${currentUser?.token}` },
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
        } finally { setIsSaving(false); }
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
            <main className="max-w-7xl mx-auto pt-4 md:pt-6 px-3 md:px-6 pb-10 flex flex-col md:flex-row gap-6">
                <Sidebar />

                <div className="flex-1 space-y-4 md:space-y-6">
                    {/* Profile Header Block */}
                    <div className="bg-white rounded-xl md:rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="h-44 md:h-64 bg-gray-200 relative group">
                            {profile.coverPic ? (
                                <img src={profile.coverPic} className="w-full h-full object-cover" alt="Cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-r from-[#1a237e] via-[#283593] to-[#3949ab]">
                                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                                </div>
                            )}
                            {isSelf && (
                                <button onClick={() => setIsEditing(true)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white transition-all opacity-0 group-hover:opacity-100">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                </button>
                            )}
                        </div>

                        <div className="px-5 md:px-8 pb-6 md:pb-8">
                            <div className="relative flex justify-between items-end -mt-12 md:-mt-16 mb-4 md:mb-6">
                                <div className="p-1 bg-white rounded-full shadow-lg relative group">
                                    <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-blue-50 flex items-center justify-center text-4xl md:text-5xl font-black text-blue-800 uppercase overflow-hidden border-4 md:border-8 border-white">
                                        {profile.profilePic ? <img src={profile.profilePic} className="w-full h-full object-cover" alt="Profile" /> : profile.name.charAt(0)}
                                    </div>
                                    {isSelf && (
                                        <button onClick={() => setIsEditing(true)} className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                                        </button>
                                    )}
                                </div>

                                <div className="flex space-x-2 mb-2">
                                    {isSelf ? (
                                        <button onClick={() => setIsEditing(true)} className="px-4 md:px-6 py-2 bg-gray-100 text-gray-700 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95">
                                            {t('profile.edit')}
                                        </button>
                                    ) : (
                                        <>
                                            <button onClick={handleToggleFollow} className={`px-4 md:px-6 py-2 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all ${isFollowing ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-700 border-2 border-blue-200'}`}>
                                                {isFollowing ? t('profile.following') : t('profile.follow')}
                                            </button>
                                            {profile.connectionStatus === 'accepted' ? (
                                                <Link href={`/messages?user=${profile._id}`} className="px-4 md:px-6 py-2 bg-blue-700 text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95">
                                                    {t('profile.message')}
                                                </Link>
                                            ) : profile.connectionStatus === 'pending' ? (
                                                <div className="flex gap-2">
                                                    {!profile.isRequester ? (
                                                        <button onClick={handleAcceptRequest} className="px-4 md:px-6 py-2 bg-green-600 text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-black shadow-md active:scale-95 transition-all">
                                                            {t('profile.accept')}
                                                        </button>
                                                    ) : (
                                                        <button onClick={handleWithdraw} className="px-4 md:px-6 py-2 bg-red-50 text-red-600 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95 border-2 border-red-100">
                                                            {t('network.withdraw')}
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                <button onClick={handleConnect} className="px-4 md:px-6 py-2 bg-blue-700 text-white rounded-full text-[10px] md:text-xs font-bold uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95">
                                                    {t('profile.connect')}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <h1 className="text-xl md:text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                                        {profile.name}
                                        {['mentor', 'academy'].includes((profile as any).role || '') && (
                                            <span className="text-blue-500" title="Verified">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-6 md:h-6"><path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.491 4.491 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" /></svg>
                                            </span>
                                        )}
                                    </h1>
                                    <span className="bg-blue-100 text-blue-700 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">{profile.accountType === 'Aspirant' ? t('sidebar.aspirant') : profile.accountType}</span>
                                </div>
                                <p className="text-gray-600 font-medium whitespace-pre-line text-sm max-w-lg">
                                    {profile.about || t('profile.default_about')}
                                </p>
                            </div>

                            <div className="mt-4 md:mt-6 flex items-center space-x-6">
                                <button
                                    onClick={() => {
                                        setModalTitle(t('profile.connections'));
                                        setModalList(profile.connections || []);
                                        setShowListModal(true);
                                    }}
                                    className="flex flex-col items-start hover:opacity-70 transition-opacity"
                                >
                                    <span className="text-lg md:text-xl font-black text-gray-900">{profile.connections?.length || 0}</span>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('profile.connections')}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setModalTitle(t('profile.followers'));
                                        setModalList(profile.followers || []);
                                        setShowListModal(true);
                                    }}
                                    className="flex flex-col items-start hover:opacity-70 transition-opacity"
                                >
                                    <span className="text-lg md:text-xl font-black text-gray-900">{profile.followers?.length || 0}</span>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('profile.followers')}</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setModalTitle(t('profile.following_count'));
                                        setModalList(profile.following || []);
                                        setShowListModal(true);
                                    }}
                                    className="flex flex-col items-start hover:opacity-70 transition-opacity"
                                >
                                    <span className="text-lg md:text-xl font-black text-gray-900">{profile.following?.length || 0}</span>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t('profile.following_count')}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Target Exams */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6">
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">{t('profile.targeting_exams')}</h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.exams.length > 0 ? profile.exams.map(exam => (
                                <span key={exam} className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold text-gray-700">{exam}</span>
                            )) : (
                                <p className="text-xs text-gray-400 italic">{t('profile.no_exams')}</p>
                            )}
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-6 px-1 border-b border-gray-100">
                            <button onClick={() => setActiveTab('posts')} className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'posts' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-400'}`}>
                                {t('profile.activity')} ({posts.length})
                            </button>
                            {isSelf && (
                                <button onClick={() => setActiveTab('saved')} className={`pb-3 text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'saved' ? 'text-blue-700 border-b-2 border-blue-700' : 'text-gray-400'}`}>
                                    Saved ({savedPosts.length})
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            {(activeTab === 'posts' ? posts : savedPosts).length > 0 ? (
                                (activeTab === 'posts' ? posts : savedPosts).map((p) => (
                                    <PostCard key={p._id} post={p} showDelete={isSelf} onDelete={(pid) => setPosts(prev => prev.filter(x => x._id !== pid))} />
                                ))
                            ) : (
                                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                                    <p className="text-sm font-bold text-gray-300 uppercase tracking-widest italic">{t('profile.no_activity')}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Settings/Logout */}
                    {isSelf && (
                        <div className="pt-8 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <button onClick={logout} className="px-8 py-2.5 bg-white border border-red-100 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-all">
                                    {t('profile.logout')}
                                </button>
                                <button onClick={handleDeleteAccount} className="px-8 py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-md shadow-red-100">
                                    {t('profile.delete_account')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Edit Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="p-5 border-b flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">{t('profile.edit')}</h2>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('profile.label.name')}</label>
                                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('profile.label.bio')}</label>
                                <textarea value={editForm.about} onChange={(e) => setEditForm({ ...editForm, about: e.target.value })} rows={3} className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:border-blue-500 outline-none transition-all resize-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Profile Photo</label>
                                    <input type="file" accept="image/*" onChange={(e) => setEditForm({ ...editForm, profileFile: e.target.files?.[0] || null })} className="w-full text-[10px] text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 cursor-pointer" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cover Photo</label>
                                    <input type="file" accept="image/*" onChange={(e) => setEditForm({ ...editForm, coverFile: e.target.files?.[0] || null })} className="w-full text-[10px] text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-blue-50 file:text-blue-700 cursor-pointer" />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">{t('common.cancel')}</button>
                                <button type="submit" disabled={isSaving} className="flex-1 py-2 bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-md">{isSaving ? t('profile.saving') : t('profile.save_changes')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* User List Modal */}
            {showListModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">{modalTitle}</h2>
                            <button onClick={() => setShowListModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {modalList.length > 0 ? (
                                <div className="space-y-1">
                                    {modalList.map((u) => (
                                        <Link
                                            key={u._id}
                                            href={`/profile/${u._id}`}
                                            onClick={() => setShowListModal(false)}
                                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-sm font-black text-blue-800 uppercase overflow-hidden flex-shrink-0">
                                                {u.profilePic ? <img src={u.profilePic} className="w-full h-full object-cover" alt="" /> : u.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-black text-gray-900 truncate">{u.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate">{u.accountType || t('sidebar.aspirant')}</p>
                                            </div>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-sm font-bold text-gray-300 uppercase tracking-widest italic">No users found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
