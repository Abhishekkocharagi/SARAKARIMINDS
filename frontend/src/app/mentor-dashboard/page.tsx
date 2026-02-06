'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MentorDashboard() {
    const { user, updateUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [settings, setSettings] = useState({ enabled: false, price: 0 });
    const [newGroup, setNewGroup] = useState({ name: '', description: '', price: 0, maxMembers: 50, examCategory: '' });
    const [qrFile, setQrFile] = useState<File | null>(null);
    const hasRefreshed = useRef(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user && user.role !== 'mentor' && user.role !== 'admin') {
            router.push('/feed');
        } else if (user) {
            if (!hasRefreshed.current) {
                refreshUserProfile();
                hasRefreshed.current = true;
            }
            fetchStats();
            fetchGroups();
        }
    }, [user, authLoading, router]);

    const refreshUserProfile = async () => {
        if (!user) return;
        try {
            const res = await fetch('http://localhost:5000/api/users/profile', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                updateUser(data);
            }
        } catch (err) { console.error('Failed to refresh profile:', err); }
    };

    const fetchStats = async () => {
        if (!user) return;
        try {
            const res = await fetch('http://localhost:5000/api/mentor/stats', {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
                // Pre-fill settings if available (assuming user object has them or separate call)
                if (user.mentorshipPrice) setSettings({ enabled: user.mentorshipEnabled || false, price: user.mentorshipPrice });
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const fetchGroups = async () => {
        if (!user) return;
        try {
            // Reusing getMentorGroups but filtering for my own ID
            if (!user._id) return;
            const res = await fetch(`http://localhost:5000/api/groups/mentor/${user._id}`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setGroups(data);
            }
        } catch (err) { console.error(err); }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', newGroup.name);
            formData.append('description', newGroup.description);
            formData.append('price', newGroup.price.toString());
            formData.append('maxMembers', newGroup.maxMembers.toString());
            formData.append('examCategory', newGroup.examCategory);
            if (qrFile) formData.append('paymentQrImage', qrFile);

            const res = await fetch('http://localhost:5000/api/groups', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user.token}`
                },
                body: formData
            });
            if (res.ok) {
                alert('Group created successfully! Aspirants can now join.');
                setShowCreateGroup(false);
                fetchGroups();
                setNewGroup({ name: '', description: '', price: 0, maxMembers: 50, examCategory: '' });
                setQrFile(null);
            } else {
                const err = await res.json();
                alert(`Failed to create group: ${err.message}`);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            const res = await fetch('http://localhost:5000/api/mentor/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                alert('Settings updated successfully');
                setShowSettings(false);
                fetchStats(); // Refresh to ensure backend sync
            }
        } catch (err) { console.error(err); }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!user) return;
        if (!confirm('Are you sure you want to delete this community? All posts and memberships will be removed.')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/groups/${groupId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (res.ok) {
                alert('Community deleted successfully');
                fetchGroups();
            } else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (err) { console.error(err); }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto pt-6 px-6 pb-10 flex flex-col md:flex-row gap-6">
                <div className="hidden md:block w-[280px] shrink-0">
                    <Sidebar />
                </div>

                <div className="flex-1 space-y-6">
                    <header className="bg-white p-8 rounded-[2.5rem] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <span className="text-4xl">🎓</span>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Mentor Dashboard</h1>
                                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Manage your community & earnings</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <button
                                onClick={() => user?.isVerified ? setShowCreateGroup(true) : alert('Your mentor account is still pending admin verification. Once verified, you can create paid groups.')}
                                className={`${user?.isVerified ? 'bg-black hover:bg-gray-800' : 'bg-gray-400 cursor-not-allowed'} text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest transition-all shadow-lg flex items-center gap-2`}
                            >
                                <span>+</span> Create Private Group
                            </button>
                            {!user?.isVerified && (
                                <span className="text-[10px] text-amber-600 font-black uppercase tracking-widest animate-pulse">
                                    ⚠️ Verification Pending
                                </span>
                            )}
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Members</h3>
                            <p className="text-3xl font-black text-blue-900">{groups.reduce((acc, g) => acc + (g.memberCount || 0), 0)}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Groups</h3>
                            <p className="text-3xl font-black text-blue-900">{groups.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Post Reach</h3>
                            <p className="text-3xl font-black text-blue-900">{stats?.postReach || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Earnings</h3>
                            <p className="text-3xl font-black text-green-600">₹{stats?.earnings || 0}</p>
                        </div>
                    </div>

                    {/* Groups List */}
                    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Your Private Groups</h3>
                        {groups.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {groups.map(group => (
                                    <div key={group._id} className="border rounded-2xl p-6 hover:shadow-md transition">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-900 text-lg">{group.name}</h4>
                                            <span className="bg-green-100 text-green-800 text-[10px] px-2 py-1 rounded-full font-black uppercase">₹{group.price}/mo</span>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-4 line-clamp-2">{group.description}</p>
                                        <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            <span>{group.memberCount} / {group.maxMembers} Members</span>
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group._id); }}
                                                    className="text-red-400 hover:text-red-600 transition-colors"
                                                >
                                                    🗑️
                                                </button>
                                                <span className={`font-bold ${group.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>{group.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                                <p className="text-sm text-gray-400 font-bold mb-2">You haven't created any paid groups yet.</p>
                                <button onClick={() => setShowCreateGroup(true)} className="text-blue-600 text-xs font-black uppercase tracking-widest hover:underline">Start a Community</button>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions & Sessions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform text-9xl">✍️</div>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2 relative z-10">Post Mentor Insight</h3>
                            <p className="text-xs font-medium opacity-80 mb-6 relative z-10">Share expert tips and guidance. Highlighted in feed.</p>
                            <Link href="/feed" className="inline-block bg-white text-violet-700 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">Go to Feed</Link>
                        </div>

                        <div
                            onClick={() => setShowSettings(true)}
                            className="bg-white border border-gray-100 rounded-3xl p-8 group cursor-pointer hover:border-violet-200 hover:shadow-xl transition-all relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10 grayscale group-hover:grayscale-0 transition-all text-9xl">💰</div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Paid Mentorship</h3>
                            <p className="text-xs text-gray-500 font-medium mb-6">Set your hourly rates and availability slots.</p>
                            <button className="bg-gray-100 text-gray-900 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest group-hover:bg-violet-600 group-hover:text-white transition-all">Manage Settings</button>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Upcoming Sessions</h3>
                        {(stats?.pendingBookings || 0) > 0 ? (
                            <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                                <p className="text-green-800 font-bold text-sm">You have {stats.pendingBookings} upcoming session(s)! check your calendar.</p>
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm italic">No upcoming sessions booked.</p>
                        )}
                    </div>
                </div>
            </main>

            {/* Create Group Modal */}
            {showCreateGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-1">Create Private Group</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">Launch a paid study circle</p>

                        <form onSubmit={handleCreateGroup} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Group Name</label>
                                <input type="text" required className="w-full bg-gray-50 border rounded-xl p-3 font-bold text-sm outline-none focus:border-blue-600"
                                    value={newGroup.name} onChange={e => setNewGroup({ ...newGroup, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</label>
                                <textarea required rows={3} className="w-full bg-gray-50 border rounded-xl p-3 font-medium text-sm outline-none focus:border-blue-600 resize-none"
                                    value={newGroup.description} onChange={e => setNewGroup({ ...newGroup, description: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price (₹)</label>
                                    <input type="number" required className="w-full bg-gray-50 border rounded-xl p-3 font-bold text-sm outline-none focus:border-blue-600"
                                        value={newGroup.price} onChange={e => setNewGroup({ ...newGroup, price: Number(e.target.value) })} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Max Members</label>
                                    <input type="number" required className="w-full bg-gray-50 border rounded-xl p-3 font-bold text-sm outline-none focus:border-blue-600"
                                        value={newGroup.maxMembers} onChange={e => setNewGroup({ ...newGroup, maxMembers: Number(e.target.value) })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exam Category</label>
                                <select
                                    required
                                    className="w-full bg-gray-50 border rounded-xl p-3 font-bold text-sm outline-none focus:border-blue-600"
                                    value={newGroup.examCategory}
                                    onChange={e => setNewGroup({ ...newGroup, examCategory: e.target.value })}
                                >
                                    <option value="">Select Exam</option>
                                    <option value="KAS">KAS</option>
                                    <option value="FDA">FDA</option>
                                    <option value="SDA">SDA</option>
                                    <option value="PSI">PSI</option>
                                    <option value="PDO">PDO</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment QR Code (Optional)</label>
                                <div className="mt-1 flex items-center gap-4">
                                    <input type="file" accept="image/*" className="hidden" id="qr-upload"
                                        onChange={e => setQrFile(e.target.files?.[0] || null)} />
                                    <label htmlFor="qr-upload" className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors border-2 border-dashed border-gray-300">
                                        {qrFile ? qrFile.name : 'Select Image'}
                                    </label>
                                    {qrFile && <button type="button" onClick={() => setQrFile(null)} className="text-red-500 text-[10px] font-black uppercase">Remove</button>}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowCreateGroup(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="flex-1 bg-black text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-800 shadow-lg">Launch Group</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-6">Mentorship Settings</h2>
                        <form onSubmit={handleUpdateSettings} className="space-y-6">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <span className="font-bold text-gray-700">Enable Paid Mentorship</span>
                                <input
                                    type="checkbox"
                                    checked={settings.enabled}
                                    onChange={e => setSettings({ ...settings, enabled: e.target.checked })}
                                    className="w-6 h-6 accent-violet-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Price per Session (₹)</label>
                                <input
                                    type="number"
                                    value={settings.price}
                                    onChange={e => setSettings({ ...settings, price: Number(e.target.value) })}
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-violet-600 rounded-2xl p-4 font-bold text-xl outline-none"
                                />
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowSettings(false)} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="flex-1 bg-violet-600 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-violet-700 shadow-lg">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
