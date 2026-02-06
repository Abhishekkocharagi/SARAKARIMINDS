'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function GroupManagement() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const groupId = params.id;

    const [group, setGroup] = useState<any>(null);
    const [stats, setStats] = useState<any>({ members: [], posts: [] });
    const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'members' | 'settings'
    const [newPost, setNewPost] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && groupId) {
            fetchGroupDetails();
            fetchPosts();
            if (activeTab === 'members') fetchMembers();
        }
    }, [user, groupId, activeTab]);

    const fetchGroupDetails = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/groups/${groupId}`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (!data.isOwner) {
                    alert('Unauthorized Access');
                    router.push('/mentor-dashboard');
                    return;
                }
                setGroup(data);
            } else {
                router.push('/mentor-dashboard');
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchPosts = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/groups/${groupId}/posts`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats((prev: any) => ({ ...prev, posts: data }));
            }
        } catch (err) { console.error(err); }
    };

    const fetchMembers = async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/groups/${groupId}/members`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats((prev: any) => ({ ...prev, members: data }));
            }
        } catch (err) { console.error(err); }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.trim()) return;
        try {
            const res = await fetch(`http://localhost:5000/api/groups/${groupId}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ content: newPost })
            });
            if (res.ok) {
                setNewPost('');
                fetchPosts();
            }
        } catch (err) { console.error(err); }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/groups/${groupId}/members/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                fetchMembers(); // Refresh list
            }
        } catch (err) { console.error(err); }
    };

    const handleToggleStatus = async () => {
        const newStatus = group.status === 'active' ? 'disabled' : 'active';
        try {
            const res = await fetch(`http://localhost:5000/api/groups/${groupId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                setGroup({ ...group, status: newStatus });
            }
        } catch (err) { console.error(err); }
    };

    if (!user || loading) return <div className="p-10 text-center">Loading...</div>;
    if (!group) return null;

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto pt-6 px-6 pb-10 flex flex-col md:flex-row gap-6">
                <div className="hidden md:block w-[280px] shrink-0">
                    <Sidebar />
                </div>

                <div className="flex-1 space-y-6">
                    {/* Header */}
                    <header className="bg-white p-8 rounded-[2rem] border shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{group.name}</h1>
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase text-white ${group.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}>
                                        {group.status}
                                    </span>
                                </div>
                                <p className="text-gray-500 font-medium text-sm max-w-xl">{group.description}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-black text-blue-900">{group.memberCount}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Members</p>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-6 mt-8 border-b">
                            <button onClick={() => setActiveTab('feed')} className={`pb-4 text-xs font-black uppercase tracking-widest ${activeTab === 'feed' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>
                                Group Feed
                            </button>
                            <button onClick={() => setActiveTab('members')} className={`pb-4 text-xs font-black uppercase tracking-widest ${activeTab === 'members' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>
                                Members
                            </button>
                            <button onClick={() => setActiveTab('settings')} className={`pb-4 text-xs font-black uppercase tracking-widest ${activeTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>
                                Settings
                            </button>
                        </div>
                    </header>

                    {/* Tab Content */}
                    <div className="space-y-6">
                        {activeTab === 'feed' && (
                            <>
                                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                                    <form onSubmit={handleCreatePost}>
                                        <textarea
                                            value={newPost}
                                            onChange={e => setNewPost(e.target.value)}
                                            placeholder="Write an announcement or share a resource..."
                                            className="w-full bg-gray-50 border rounded-xl p-4 font-medium outline-none focus:ring-2 focus:ring-blue-100"
                                            rows={3}
                                        />
                                        <div className="flex justify-end mt-2">
                                            <button type="submit" className="bg-black text-white px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-800">
                                                Post
                                            </button>
                                        </div>
                                    </form>
                                </div>
                                <div className="space-y-4">
                                    {stats.posts.map((post: any) => (
                                        <div key={post._id} className="bg-white p-6 rounded-2xl border shadow-sm">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                                                    {post.user?.profilePic && <img src={post.user.profilePic} className="w-full h-full object-cover" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-gray-900">{post.user?.name}</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(post.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <p className="text-gray-800 font-medium whitespace-pre-line">{post.content}</p>
                                        </div>
                                    ))}
                                    {stats.posts.length === 0 && <p className="text-center text-gray-400 italic py-10">No messages yet.</p>}
                                </div>
                            </>
                        )}

                        {activeTab === 'members' && (
                            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                                {stats.members.length > 0 ? (
                                    <ul className="divide-y">
                                        {stats.members.map((m: any) => (
                                            <li key={m._id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center font-bold text-blue-600">
                                                        {m.user?.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-gray-900">{m.user?.name}</h4>
                                                        <p className="text-[10px] text-gray-400 uppercase tracking-wide">{m.user?.email}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveMember(m.user?._id)}
                                                    className="text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="p-10 text-center text-gray-400 italic">No members found.</p>
                                )}
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <h3 className="font-bold text-gray-900">Pause / Disable Community</h3>
                                        <p className="text-xs text-gray-500 mt-1">Temporarily prevent new members from joining.</p>
                                    </div>
                                    <button
                                        onClick={handleToggleStatus}
                                        className={`px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest text-white ${group.status === 'active' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                                    >
                                        {group.status === 'active' ? 'Disable' : 'Enable'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
