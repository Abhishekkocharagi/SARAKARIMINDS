'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/config';
import socket from '@/socket';

interface Stats {
    totalUsers: number;
    totalPosts: number;
    totalStories: number;
    pendingMentors: number;
    pendingAcademies: number;
}

interface Activity {
    type: string;
    data: any;
    timestamp: Date;
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user?.token) {
            fetchStats();

            // Socket setup
            socket.connect();
            socket.emit('joinAdminRoom');

            socket.on('live_activity', (activity: Activity) => {
                setActivities(prev => [activity, ...prev].slice(0, 10));
                // Refresh stats on relevant activities
                if (['NEW_USER', 'NEW_POST', 'NEW_STORY'].includes(activity.type)) {
                    fetchStats();
                }

                console.log('Live Activity:', activity);
            });

            return () => {
                socket.off('live_activity');
                socket.disconnect();
            };
        }
    }, [user]);

    const fetchStats = async () => {
        setError(null);
        setLoading(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const res = await fetch(`${API_BASE_URL}/api/admin/stats`, {
                headers: { 'Authorization': `Bearer ${user?.token}` },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
            } else {
                const errData = await res.json().catch(() => ({}));
                setError(errData.message || 'Failed to fetch platform statistics.');
            }
        } catch (err: any) {
            console.error('Stats fetch error:', err);
            if (err.name === 'AbortError') {
                setError('Connection timed out. The server might be slow or unreachable.');
            } else {
                setError('Could not connect to the server. Please check your internet or if the backend is running.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                <div className="animate-pulse text-gray-400 font-bold uppercase tracking-widest text-xs">Collecting Platform Stats...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] bg-white rounded-[2.5rem] border border-red-100 p-8 shadow-sm">
                <div className="text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-black text-gray-900 mb-2 uppercase italic">Connection Issue</h2>
                <p className="text-gray-500 text-sm font-medium mb-6 text-center max-w-sm">{error}</p>
                <button
                    onClick={fetchStats}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    const statCards = [
        { name: 'Total Users', value: stats?.totalUsers || 0, icon: '👥', color: 'bg-blue-500' },
        { name: 'Total Posts', value: stats?.totalPosts || 0, icon: '📝', color: 'bg-purple-500' },
        { name: 'Total Stories', value: stats?.totalStories || 0, icon: '🎬', color: 'bg-pink-500' },
        { name: 'Pending Mentors', value: stats?.pendingMentors || 0, icon: '🎓', color: 'bg-orange-500' },
        { name: 'Pending Academies', value: stats?.pendingAcademies || 0, icon: '🏛️', color: 'bg-green-500' },
    ];

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'NEW_USER': return '👤';
            case 'NEW_POST': return '📝';
            case 'NEW_COMMENT': return '💬';
            case 'NEW_STORY': return '🎬';
            case 'NEW_EXAM': return '📚';
            default: return '⚡';
        }
    };

    return (
        <div className="max-w-7xl mx-auto pb-20">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">System Overview</h1>
                    <p className="text-gray-500 mt-2 font-medium flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Real-time platform metrics and status.
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Server Status</p>
                    <p className="text-sm font-bold text-green-600">Online & Encrypted</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {statCards.map((stat) => (
                    <div key={stat.name} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`${stat.color} w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform`}>
                                {stat.icon}
                            </div>
                            <span className="text-2xl font-black text-gray-900">{stat.value}</span>
                        </div>
                        <h3 className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{stat.name}</h3>
                    </div>
                ))}
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Live Activity Feed */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Live Activity</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Global Platform Stream</p>
                        </div>
                        <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                            Live updates
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px]">
                        {activities.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                                <span className="text-4xl mb-4">📡</span>
                                <p className="text-sm font-bold uppercase tracking-widest">Waiting for activities...</p>
                            </div>
                        ) : (
                            activities.map((activity, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-50 hover:border-blue-100 hover:bg-white transition-all animate-in slide-in-from-top duration-300">
                                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-lg border border-gray-100">
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-bold text-gray-900">
                                                {activity.type === 'NEW_USER' && `Welcome ${activity.data.name}!`}
                                                {activity.type === 'NEW_POST' && `${activity.data.user} published a new post.`}
                                                {activity.type === 'NEW_COMMENT' && `${activity.data.user} commented on a post.`}
                                                {activity.type === 'NEW_EXAM' && `New exam added: ${activity.data.name}`}
                                            </p>
                                            <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap ml-4">
                                                {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                                            {activity.type === 'NEW_USER' && `Account: ${activity.data.email}`}
                                            {activity.type === 'NEW_POST' && activity.data.content}
                                            {activity.type === 'NEW_COMMENT' && activity.data.text}
                                            {activity.type === 'NEW_EXAM' && `Category: ${activity.data.category}`}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="p-4 bg-gray-50 border-t border-gray-100">
                        <p className="text-[10px] text-gray-400 text-center font-bold uppercase tracking-widest">Showing last 10 activities</p>
                    </div>
                </div>

                {/* Side Actions */}
                <div className="space-y-8">
                    <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white">
                        <h3 className="text-xl font-bold mb-6">Admin Quick Links</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { name: 'Daily Quiz', icon: '⭐', href: '/admin/quiz' },
                                { name: 'Puzzle Zone', icon: '🧩', href: '/admin/jilebi' },
                                { name: 'Broadcast', icon: '📢', href: '#' },
                                { name: 'Cleanup', icon: '🧹', href: '#' },
                            ].map((link) => (
                                <button
                                    key={link.name}
                                    onClick={() => link.href !== '#' && router.push(link.href)}
                                    className="bg-gray-800 hover:bg-blue-600 p-4 rounded-2xl text-left transition-all group"
                                >
                                    <span className="block text-2xl mb-2 group-hover:scale-110 transition-transform">{link.icon}</span>
                                    <span className="font-bold text-sm">{link.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-blue-500/20">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-2">Need Help?</h3>
                            <p className="text-blue-100 mb-6 text-sm">Access documentation or contact support for advanced platform controls.</p>
                            <button className="bg-white text-blue-600 w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition hover:bg-blue-50 shadow-xl">
                                Read Handbook
                            </button>
                        </div>
                        <div className="absolute -bottom-10 -right-10 text-[140px] opacity-10 rotate-12 group-hover:scale-110 transition-transform">
                            🛡️
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
