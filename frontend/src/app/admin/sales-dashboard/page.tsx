'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, Legend
} from 'recharts';
import {
    Users, TrendingUp, Bell, MessageSquare, Briefcase,
    Filter, RefreshCw, ChevronRight, MapPin, Activity
} from 'lucide-react';

interface DashboardData {
    mau: {
        total: number;
        growth: number;
        trend: { month: string; users: number }[];
    };
    examDistribution: { id: string; name: string; count: number; percentage: number }[];
    notificationReach: {
        total: number;
        read: number;
        reachRate: number;
    };
    community: {
        total: number;
        active: number;
        paid: number;
        free: number;
        totalMembers: number;
        topCommunities: { name: string; posts: number }[];
    };
    sampleLeads: {
        exam: string;
        city: string;
        engagement: string;
        lastActiveDate: string;
    }[];
}

export default function SalesDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('30');
    const [exams, setExams] = useState<{ _id: string; name: string }[]>([]);
    const [selectedExam, setSelectedExam] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        else setIsRefreshing(true);

        try {
            const queryParams = new URLSearchParams({
                timeframe,
                ...(selectedExam && { examId: selectedExam })
            });

            const res = await fetch(`http://localhost:5000/api/analytics/sales-dashboard?${queryParams}`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });

            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [user?.token, timeframe, selectedExam]);

    const fetchExams = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:5000/api/exams', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const result = await res.json();
                setExams(result);
            }
        } catch (err) {
            console.error('Error fetching exams:', err);
        }
    }, [user?.token]);

    useEffect(() => {
        if (user?.token) {
            fetchData();
            fetchExams();
        }
    }, [user?.token, timeframe, selectedExam, fetchData, fetchExams]);

    // Polling logic
    useEffect(() => {
        const interval = setInterval(() => {
            fetchData(false);
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh]">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-bold animate-pulse">Generating Live Traction Data...</p>
            </div>
        );
    }

    if (!data) return <div>Failed to load data.</div>;

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#facc15'];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Sales & Growth Dashboard</h1>
                    <p className="text-gray-500 mt-2 font-medium flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-500" />
                        Live Platform Traction for Academies & Monetization
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1">
                        <button
                            onClick={() => setTimeframe('7')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeframe === '7' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            7 Days
                        </button>
                        <button
                            onClick={() => setTimeframe('30')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${timeframe === '30' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            30 Days
                        </button>
                    </div>

                    <select
                        value={selectedExam}
                        onChange={(e) => setSelectedExam(e.target.value)}
                        className="bg-white border border-gray-100 rounded-xl px-4 py-2 text-sm font-bold shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="">All Exams</option>
                        {exams.map(exam => (
                            <option key={exam._id} value={exam._id}>{exam.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => fetchData(false)}
                        className={`p-2 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all ${isRefreshing ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </header>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* MAU Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                            <Users className="w-6 h-6" />
                        </div>
                        <div className={`flex items-center gap-1 text-sm font-bold ${data.mau.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            <TrendingUp className={`w-4 h-4 ${data.mau.growth < 0 ? 'rotate-180' : ''}`} />
                            {Math.abs(data.mau.growth)}%
                        </div>
                    </div>
                    <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-1">Monthly Active Users</h3>
                    <p className="text-3xl font-black text-gray-900">{data.mau.total.toLocaleString()}</p>
                </div>

                {/* Notification Reach Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-purple-500/10 p-3 rounded-2xl text-purple-600 group-hover:scale-110 transition-transform">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-tighter">
                            {timeframe}d Reach
                        </div>
                    </div>
                    <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-1">Notification Reach</h3>
                    <p className="text-3xl font-black text-gray-900">{data.notificationReach.reachRate}%</p>
                </div>

                {/* Community Engagement Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-green-500/10 p-3 rounded-2xl text-green-600 group-hover:scale-110 transition-transform">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-tighter">
                            {data.community.active} Active
                        </div>
                    </div>
                    <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-1">Total Communities</h3>
                    <p className="text-3xl font-black text-gray-900">{data.community.total}</p>
                </div>

                {/* Paid Subs Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-orange-500/10 p-3 rounded-2xl text-orange-600 group-hover:scale-110 transition-transform">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <div className="text-gray-400 text-xs font-bold uppercase tracking-tighter">
                            {data.community.paid} Paid Groups
                        </div>
                    </div>
                    <h3 className="text-gray-400 font-bold uppercase tracking-widest text-xs mb-1">Paid Memberships</h3>
                    <p className="text-3xl font-black text-gray-900">{data.community.totalMembers}</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* MAU Trend Chart */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        User Growth Trend (MAU)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.mau.trend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontWeight: 'bold', fontSize: 12 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontWeight: 'bold', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ fontWeight: 'bold' }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="users"
                                    stroke="#3b82f6"
                                    strokeWidth={4}
                                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                                    activeDot={{ r: 8 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Exam Distribution Chart */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Filter className="w-5 h-5 text-purple-500" />
                        Exam-wise Distribution
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.examDistribution.slice(0, 6)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#4b5563', fontWeight: 'bold', fontSize: 13 }}
                                    width={80}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                                    {data.examDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Leads & Communities */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sample Leads (For Sales) */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-orange-500" />
                            Live Anonymized Sample Leads
                        </h3>
                        <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-black uppercase">
                            Sales Ready
                        </span>
                    </div>
                    <div className="overflow-x-auto p-4">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-gray-400 text-xs font-bold uppercase tracking-widest border-b border-gray-50">
                                    <th className="px-4 py-4">Exam Target</th>
                                    <th className="px-4 py-4">Location</th>
                                    <th className="px-4 py-4">Engagement</th>
                                    <th className="px-4 py-4 text-right">Last Active</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.sampleLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500 font-medium">No leads found for current filter.</td>
                                    </tr>
                                ) : (
                                    data.sampleLeads.map((lead, i) => (
                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4 font-bold text-gray-900">{lead.exam}</td>
                                            <td className="px-4 py-4 text-gray-500 font-medium flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {lead.city}
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${lead.engagement === 'High' ? 'bg-green-100 text-green-700' :
                                                    lead.engagement === 'Medium' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                    {lead.engagement}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right text-sm text-gray-500 font-bold">{lead.lastActiveDate}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <button className="m-4 py-3 bg-gray-50 text-gray-500 font-bold rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-2 text-sm">
                        View More Lead Insights <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Top Communities */}
                <div className="bg-gray-900 rounded-3xl p-8 text-white">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        Engagement Pulse
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Top Active Communities (7d)</p>
                            <div className="space-y-4">
                                {data.community.topCommunities.map((comm, i) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-xs">
                                                {i + 1}
                                            </div>
                                            <span className="font-bold group-hover:text-blue-400 transition-colors">{comm.name}</span>
                                        </div>
                                        <div className="text-sm font-black bg-gray-800 px-3 py-1 rounded-lg">
                                            {comm.posts} Posts
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-6 border-t border-gray-800">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-gray-400 text-sm font-bold">Premium Conversion</span>
                                <span className="text-blue-400 font-black">
                                    {data.community.total > 0 ? Math.round((data.community.paid / data.community.total) * 100) : 0}%
                                </span>
                            </div>
                            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${data.community.total > 0 ? (data.community.paid / data.community.total) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl p-4 mt-4">
                            <p className="text-blue-200 text-xs font-medium leading-relaxed">
                                <span className="font-black text-blue-100 block mb-1">PRO TIP</span>
                                Academies focusing on {data.examDistribution[0]?.name || 'trending'} exams see 2.4x higher engagement in paid communities.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
