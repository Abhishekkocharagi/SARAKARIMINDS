'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import PostCard from '@/components/PostCard';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

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
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<{
        name: string;
        about: string;
        profilePic: string;
        coverPic: string;
        profileFile: File | null;
        coverFile: File | null;
    }>({
        name: '',
        about: '',
        profilePic: '',
        coverPic: '',
        profileFile: null,
        coverFile: null
    });
    const [isSaving, setIsSaving] = useState(false);

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
                    });
                }

                setEditForm({
                    name: data.name,
                    about: data.about || '',
                    profilePic: data.profilePic || '',
                    coverPic: data.coverPic || '',
                    profileFile: null,
                    coverFile: null
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

    const loadPage = async () => {
        setLoading(true);
        await Promise.all([fetchProfile(), fetchPosts()]);
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
        if (!confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) return;

        try {
            const res = await fetch('http://localhost:5000/api/users/profile', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentUser?.token}` }
            });
            if (res.ok) {
                alert('Account deleted successfully.');
                logout();
            } else {
                alert('Failed to delete account.');
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
            const res = await fetch('http://localhost:5000/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${currentUser?.token}`
                },
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                updateUser({
                    name: data.name,
                    profilePic: data.profilePic,
                    coverPic: data.coverPic,
                    about: data.about
                });
                setIsEditing(false);
                fetchProfile();
                alert('Profile updated successfully!');
            } else {
                const errorData = await res.json();
                alert(`Update failed: ${errorData.message}`);
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred while updating profile.');
        } finally {
            setIsSaving(false);
        }
    };

    if (loading && !profile) return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <div className="pt-32 text-center text-gray-400 font-black uppercase tracking-widest animate-pulse">Loading Profile...</div>
        </div>
    );

    if (!profile) return null;

    const isSelf = currentUser?._id === profile._id;

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-6xl mx-auto pt-24 px-4 pb-10 flex flex-col md:flex-row gap-6">
                <div className="hidden lg:block w-1/4">
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
                                                Edit Profile
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handleToggleFollow}
                                                className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${isFollowing ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-700 border-2 border-blue-200'}`}
                                            >
                                                {isFollowing ? 'Following' : 'Follow'}
                                            </button>

                                            {profile.connectionStatus === 'accepted' ? (
                                                <Link href={`/messages?user=${profile._id}`} className="px-6 py-2.5 bg-blue-700 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95">
                                                    Message
                                                </Link>
                                            ) : profile.connectionStatus === 'pending' ? (
                                                <button
                                                    onClick={!profile.isRequester ? handleAcceptRequest : undefined}
                                                    disabled={profile.isRequester}
                                                    className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all ${profile.isRequester ? 'bg-gray-100 text-gray-400' : 'bg-green-600 text-white hover:bg-black shadow-lg active:scale-95'}`}
                                                >
                                                    {profile.isRequester ? 'Pending' : 'Accept Request'}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleConnect}
                                                    className="px-6 py-2.5 bg-blue-700 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                                                >
                                                    Connect
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">{profile.name}</h1>
                                    <span className="bg-blue-100 text-blue-700 text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest">{profile.accountType}</span>
                                </div>
                                <p className="text-gray-600 font-medium whitespace-pre-line text-sm max-w-lg">
                                    {profile.about || "Aspirant at SarkariMinds community."}
                                </p>
                            </div>

                            <div className="mt-6 flex items-center space-x-6">
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-gray-900">{profile.connections?.length || 0}</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Connections</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-gray-900">{profile.followers?.length || 0}</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Followers</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xl font-black text-gray-900">{profile.following?.length || 0}</span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Following</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                                <div className="p-6 border-b flex justify-between items-center">
                                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Edit Profile</h2>
                                    <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-bold focus:border-blue-600 outline-none transition"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bio</label>
                                        <textarea
                                            value={editForm.about}
                                            onChange={(e) => setEditForm({ ...editForm, about: e.target.value })}
                                            rows={3}
                                            placeholder="Write something about yourself..."
                                            className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-medium focus:border-blue-600 outline-none transition resize-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profile Photo</label>
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
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cover Photo</label>
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
                                    <div className="pt-4 flex space-x-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(false)}
                                            className="flex-1 px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="flex-1 px-6 py-3 bg-blue-700 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                        >
                                            {isSaving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Target Exams */}
                    <div className="bg-white rounded-2xl border shadow-sm p-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Targeting Exams</h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.exams.length > 0 ? profile.exams.map(exam => (
                                <span key={exam} className="px-4 py-2 bg-gray-50 border rounded-xl text-xs font-bold text-gray-700 hover:border-blue-200 hover:bg-blue-50 transition-colors">
                                    {exam}
                                </span>
                            )) : (
                                <p className="text-xs text-gray-400 italic">No exams specified yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Posts Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-[0.2em]">Activity</h3>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{posts.length} Posts</span>
                        </div>

                        {posts.length > 0 ? (
                            posts.map((post: any) => (
                                <PostCard key={post._id} post={post} />
                            ))
                        ) : (
                            <div className="bg-white rounded-2xl border p-20 text-center">
                                <p className="text-sm font-black text-gray-300 uppercase tracking-widest italic">No activities shared yet</p>
                            </div>
                        )}
                    </div>

                    {/* Account Management (Self Only) */}
                    {isSelf && (
                        <div className="pt-10 pb-6 border-t border-gray-200">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 text-center">Account Settings</h3>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={logout}
                                    className="w-full sm:w-auto px-8 py-3 bg-white border-2 border-red-100 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95"
                                >
                                    Log Out from SarkariMinds
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    className="w-full sm:w-auto px-8 py-3 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all active:scale-95 shadow-lg shadow-red-200"
                                >
                                    Permanently Delete Account
                                </button>
                            </div>
                            <p className="mt-4 text-[10px] text-gray-400 text-center font-bold uppercase tracking-widest opacity-50">
                                Warning: Deleting your account is irreversible.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
