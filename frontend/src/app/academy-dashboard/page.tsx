'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AcademyDashboard() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }
        if (user && user.role !== 'academy' && user.role !== 'admin') {
            router.push('/feed');
        } else if (user) {
            fetchStats();
        }
    }, [user, authLoading, router]);

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/academy/stats', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
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
                    <header className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="text-4xl">🏛️</span>
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Academy Dashboard</h1>
                                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Manage your institute & courses</p>
                            </div>
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Inquiries</h3>
                            <p className="text-4xl font-black text-blue-900">{stats?.totalInquiries || 0}</p>
                            <span className="text-[10px] text-green-500 font-bold">Messages Received</span>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Active Batches</h3>
                            <p className="text-4xl font-black text-blue-900">{stats?.activeBatches || 0}</p>
                            <span className="text-[10px] text-gray-400 font-bold">Running Groups</span>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Page Reach</h3>
                            <p className="text-4xl font-black text-blue-900">{stats?.postReach || 0}</p>
                            <span className="text-[10px] text-green-500 font-bold">Total Engagement</span>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform text-9xl">📣</div>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2 relative z-10">New Admission Post</h3>
                            <p className="text-xs font-medium opacity-80 mb-6 relative z-10">Announce new batches securely. Reaches targeted aspirants.</p>
                            <h3 className="text-xl font-black uppercase tracking-tight mb-2 relative z-10">New Admission Post</h3>
                            <p className="text-xs font-medium opacity-80 mb-6 relative z-10">Announce new batches securely. Reaches targeted aspirants.</p>
                            <Link href="/academy/campaign/create" className="inline-block bg-white text-blue-900 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">Create Announcement</Link>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-3xl p-8 group cursor-pointer hover:border-blue-200 hover:shadow-xl transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10 grayscale group-hover:grayscale-0 transition-all text-9xl">📊</div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Promote Academy</h3>
                            <p className="text-xs text-gray-500 font-medium mb-6">Boost your profile visibility to nearby students.</p>
                            <Link href="/academy/campaigns" className="inline-block bg-gray-100 text-gray-900 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">Start Campaign</Link>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-gray-100">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-6">Recent Enquiries</h3>
                        {stats?.recentEnquiries?.length > 0 ? (
                            <div className="space-y-4">
                                {stats.recentEnquiries.map((msg: any) => (
                                    <div key={msg._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white border rounded-xl flex items-center justify-center overflow-hidden">
                                                {msg.sender?.profilePic ? (
                                                    <img src={`http://localhost:5000${msg.sender.profilePic}`} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="font-bold text-gray-400 text-xl">{msg.sender?.name?.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{msg.sender?.name || 'Aspirant'}</h4>
                                                <p className="text-[10px] text-gray-400 line-clamp-1">{msg.text || 'Sent an attachment'}</p>
                                            </div>
                                        </div>
                                        <Link href="/messages" className="text-xs font-black text-blue-600 bg-white border px-3 py-1 rounded-lg hover:bg-blue-600 hover:text-white transition">Reply</Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-sm italic">No recent enquiries found.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
