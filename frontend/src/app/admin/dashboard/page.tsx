'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface Stats {
    totalUsers: number;
    totalPosts: number;
    totalStories: number;
    pendingMentors: number;
    pendingAcademies: number;
}

export default function AdminDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.token) {
            fetchStats();
        }
    }, [user]);

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/stats', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-pulse text-gray-400 font-bold">Loading stats...</div>
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

    return (
        <div>
            <header className="mb-10">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">System Overview</h1>
                <p className="text-gray-500 mt-2 font-medium">Real-time platform metrics and status.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {statCards.map((stat) => (
                    <div key={stat.name} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-6">
                            <div className={`${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-gray-200 group-hover:scale-110 transition-transform`}>
                                {stat.icon}
                            </div>
                            <span className="text-4xl font-black text-gray-900">{stat.value}</span>
                        </div>
                        <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs">{stat.name}</h3>
                    </div>
                ))}
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-900 rounded-3xl p-8 text-white">
                    <h3 className="text-xl font-bold mb-4">Admin Quick Links</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="bg-gray-800 hover:bg-gray-700 p-4 rounded-2xl text-left transition">
                            <span className="block text-2xl mb-2">📢</span>
                            <span className="font-bold">Clear Broadcast</span>
                        </button>
                        <button className="bg-gray-800 hover:bg-gray-700 p-4 rounded-2xl text-left transition">
                            <span className="block text-2xl mb-2">🧹</span>
                            <span className="font-bold">Cleanup DB</span>
                        </button>
                    </div>
                </div>
                <div className="bg-blue-600 rounded-3xl p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2">Need Help?</h3>
                        <p className="text-blue-100 mb-6">Access documentation or contact support for advanced platform controls.</p>
                        <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-black text-sm uppercase transition hover:bg-blue-50">
                            Read Handbook
                        </button>
                    </div>
                    <div className="absolute -bottom-10 -right-10 text-[160px] opacity-10 rotate-12">
                        🛡️
                    </div>
                </div>
            </div>
        </div>
    );
}
