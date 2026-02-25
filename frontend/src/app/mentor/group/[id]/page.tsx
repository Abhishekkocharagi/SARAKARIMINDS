'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { API_BASE_URL } from '@/config';

const renderTextWithLinks = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
        if (part.match(urlRegex)) {
            return (
                <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold break-all">
                    {part}
                </a>
            );
        }
        return part;
    });
};

export default function GroupManagement() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams();
    const groupId = params.id;

    const [group, setGroup] = useState<any>(null);
    const [stats, setStats] = useState<any>({ members: [], posts: [], requests: [] });
    const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'members' | 'requests' | 'settings'
    const [newPost, setNewPost] = useState('');
    const [loading, setLoading] = useState(true);
    const [manualEmail, setManualEmail] = useState('');
    const [addingMember, setAddingMember] = useState(false);

    useEffect(() => {
        if (user && groupId) {
            fetchGroupDetails();
            fetchPosts();
            if (activeTab === 'members') fetchMembers();
            if (activeTab === 'requests') fetchRequests();
        }
    }, [user, groupId, activeTab]);

    const fetchGroupDetails = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}`, {
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
            const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/posts`, {
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
            const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats((prev: any) => ({ ...prev, members: data }));
            }
        } catch (err) { console.error(err); }
    };

    const fetchRequests = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/pending-members`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats((prev: any) => ({ ...prev, requests: data }));
            }
        } catch (err) { console.error(err); }
    };

    const handleApprove = async (requestId: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/groups/memberships/${requestId}/approve`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                alert('Approved!');
                fetchRequests();
                fetchMembers();
            }
        } catch (err) { console.error(err); }
    };

    const handleReject = async (requestId: string) => {
        if (!confirm('Reject this request?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/groups/memberships/${requestId}/reject`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                fetchRequests();
            }
        } catch (err) { console.error(err); }
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.trim()) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/posts`, {
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
            const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members/${userId}`, {
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
            const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/status`, {
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

    const handleUpdateChatSettings = async (allowAdminsOnly: boolean) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/chat-settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ allowOnlyAdminsChat: allowAdminsOnly })
            });
            if (res.ok) {
                setGroup({ ...group, allowOnlyAdminsChat: allowAdminsOnly });
            }
        } catch (err) { console.error(err); }
    };

    const handleAddMemberManually = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualEmail.trim()) return;
        setAddingMember(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/add-member`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ email: manualEmail })
            });
            const data = await res.json();
            if (res.ok) {
                alert('Member added successfully!');
                setManualEmail('');
                fetchMembers();
                fetchGroupDetails(); // Update count
            } else {
                alert(data.message);
            }
        } catch (err) { console.error(err); } finally { setAddingMember(false); }
    };

    const handleUpdateRole = async (userId: string, currentRole: string) => {
        const newRole = currentRole === 'admin' ? 'member' : 'admin';
        try {
            const res = await fetch(`${API_BASE_URL}/api/groups/${groupId}/members/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                fetchMembers();
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
                                Chat History
                            </button>
                            <button onClick={() => setActiveTab('members')} className={`pb-4 text-xs font-black uppercase tracking-widest ${activeTab === 'members' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>
                                Members
                            </button>
                            <button onClick={() => setActiveTab('requests')} className={`pb-4 text-xs font-black uppercase tracking-widest ${activeTab === 'requests' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>
                                Requests {stats.requests.length > 0 && <span className="ml-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-[8px]">{stats.requests.length}</span>}
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
                                            placeholder="Send a message to the community..."
                                            className="w-full bg-gray-50 border rounded-xl p-4 font-medium outline-none focus:ring-2 focus:ring-blue-100"
                                            rows={3}
                                        />
                                        <div className="flex justify-end mt-2">
                                            <button type="submit" className="bg-black text-white px-6 py-2 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-800">
                                                Send
                                            </button>
                                        </div>
                                    </form>
                                </div>
                                <div className="space-y-4">
                                    {stats.posts.map((post: any) => (
                                        <div key={post._id} className="bg-white p-6 rounded-2xl border shadow-sm">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex items-center justify-center font-bold text-gray-500">
                                                    {post.sender?.profilePic ? <img src={post.sender.profilePic} className="w-full h-full object-cover" /> : post.sender?.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-gray-900">{post.sender?.name}</h4>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(post.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className={`p-4 rounded-xl ${post.isDeletedForEveryone ? 'bg-gray-50 text-gray-400 italic border border-dashed' : 'text-gray-800 font-medium'}`}>
                                                {post.isDeletedForEveryone ? 'This message was deleted' : renderTextWithLinks(post.text)}
                                            </div>
                                        </div>
                                    ))}
                                    {stats.posts.length === 0 && <p className="text-center text-gray-400 italic py-10">No messages yet.</p>}
                                </div>
                            </>
                        )}

                        {activeTab === 'members' && (
                            <div className="space-y-6">
                                {/* Add Member Manually */}
                                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Add Member Manually</h3>
                                    <form onSubmit={handleAddMemberManually} className="flex gap-2">
                                        <input
                                            type="email"
                                            value={manualEmail}
                                            onChange={e => setManualEmail(e.target.value)}
                                            placeholder="User's email address..."
                                            className="flex-1 bg-gray-50 border rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                                        />
                                        <button
                                            disabled={addingMember}
                                            type="submit"
                                            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-md shadow-blue-100 disabled:opacity-50"
                                        >
                                            {addingMember ? 'Adding...' : 'Add User'}
                                        </button>
                                    </form>
                                </div>

                                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                                    {stats.members.length > 0 ? (
                                        <ul className="divide-y text-[10px]">
                                            {stats.members.map((m: any) => (
                                                <li key={m._id} className="p-4 flex justify-between items-center hover:bg-gray-50">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center font-black text-blue-600 border border-blue-100 shadow-sm">
                                                                {m.user?.profilePic ? <img src={m.user.profilePic} className="w-full h-full object-cover rounded-full" /> : m.user?.name?.charAt(0)}
                                                            </div>
                                                            {m.role === 'admin' && (
                                                                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[7px] font-black px-1 rounded-sm uppercase ring-2 ring-white">Admin</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-sm text-gray-900 leading-tight">{m.user?.name}</h4>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{m.user?.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-4 items-center">
                                                        <button
                                                            onClick={() => handleUpdateRole(m.user?._id, m.role)}
                                                            className={`font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${m.role === 'admin' ? 'border-gray-200 text-gray-400 hover:bg-gray-50' : 'border-blue-200 text-blue-600 hover:bg-blue-50'}`}
                                                        >
                                                            {m.role === 'admin' ? 'Dismiss as Admin' : 'Make Admin'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveMember(m.user?._id)}
                                                            className="text-red-500 font-black uppercase tracking-widest hover:underline"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="p-10 text-center text-gray-400 italic font-medium">No members found.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'requests' && (
                            <div className="space-y-4">
                                {group.isPaid && group.paymentQrImage && (
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex items-center gap-4">
                                        <div className="bg-white p-2 rounded-lg border shadow-sm">
                                            <img src={group.paymentQrImage} className="w-24 h-24 object-contain" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-blue-900">Your Payment QR</p>
                                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tight">Verify transactions against this scanner</p>
                                        </div>
                                    </div>
                                )}
                                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                                    {stats.requests.length > 0 ? (
                                        <ul className="divide-y">
                                            {stats.requests.map((r: any) => (
                                                <li key={r._id} className="p-6 flex justify-between items-center hover:bg-gray-50 transition">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-blue-100 rounded-full overflow-hidden flex items-center justify-center font-bold text-blue-700">
                                                            {r.user?.profilePic ? <img src={r.user.profilePic} className="w-full h-full object-cover" /> : r.user?.name?.[0]}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-gray-900">{r.user?.name}</h4>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-black uppercase">Paid ₹{r.amountPaid}</span>
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">• {new Date(r.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => handleReject(r._id)}
                                                            className="px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            onClick={() => handleApprove(r._id)}
                                                            className="px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 shadow-md shadow-green-100 transition"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-20 text-center flex flex-col items-center">
                                            <div className="text-4xl mb-4">✨</div>
                                            <h3 className="text-lg font-black text-gray-900 italic">All Clear!</h3>
                                            <p className="text-gray-400 text-sm font-medium">No pending join requests at the moment.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="space-y-6">
                                <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6">
                                    {/* Community Status */}
                                    <div className="flex items-center justify-between p-6 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                                        <div>
                                            <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">Community Visibility</h3>
                                            <p className="text-[11px] text-gray-400 font-bold uppercase mt-1">Temporarily hide your community from discovery</p>
                                        </div>
                                        <button
                                            onClick={handleToggleStatus}
                                            className={`px-8 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] text-white transition-all shadow-lg ${group.status === 'active' ? 'bg-red-500 hover:bg-black shadow-red-100' : 'bg-green-600 hover:bg-black shadow-green-100'}`}
                                        >
                                            {group.status === 'active' ? 'Disable' : 'Enable'}
                                        </button>
                                    </div>

                                    {/* Chat Permissions */}
                                    <div className="flex items-center justify-between p-6 bg-blue-50/50 rounded-[1.5rem] border border-blue-100">
                                        <div>
                                            <h3 className="font-black text-blue-900 uppercase tracking-tight text-sm">Chat Permissions</h3>
                                            <p className="text-[11px] text-blue-600/60 font-bold uppercase mt-1">Control who can send messages</p>
                                        </div>
                                        <div className="flex bg-white p-1 rounded-xl shadow-inner border">
                                            <button
                                                onClick={() => handleUpdateChatSettings(false)}
                                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${!group.allowOnlyAdminsChat ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}
                                            >
                                                Everyone
                                            </button>
                                            <button
                                                onClick={() => handleUpdateChatSettings(true)}
                                                className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${group.allowOnlyAdminsChat ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400'}`}
                                            >
                                                Admins Only
                                            </button>
                                        </div>
                                    </div>

                                    {/* Delete Group (DANGER AREA) */}
                                    <div className="pt-6 border-t">
                                        <button
                                            onClick={() => {
                                                if (confirm('CRITICAL: This will PERMANENTLY delete the community, all members, and all posts. This cannot be undone. Type "DELETE" to confirm.')) {
                                                    const confirmation = prompt('Type DELETE to confirm:');
                                                    if (confirmation === 'DELETE') {
                                                        fetch(`${API_BASE_URL}/api/groups/${groupId}`, {
                                                            method: 'DELETE',
                                                            headers: { 'Authorization': `Bearer ${user?.token}` }
                                                        }).then(res => {
                                                            if (res.ok) router.push('/messages');
                                                            else alert('Error deleting group');
                                                        });
                                                    }
                                                }
                                            }}
                                            className="text-red-500 text-[10px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity"
                                        >
                                            Delete Permanentely
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
