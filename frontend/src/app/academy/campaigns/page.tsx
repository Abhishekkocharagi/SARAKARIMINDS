'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function MyCampaigns() {
    const { user } = useAuth();
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchCampaigns();
    }, [user]);

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/campaigns/my', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                setCampaigns(await res.json());
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto pt-6 px-6 pb-10 flex flex-col md:flex-row gap-6">
                <div className="hidden md:block w-[280px] shrink-0">
                    <Sidebar />
                </div>
                <div className="flex-1 space-y-6">
                    <header className="flex justify-between items-center bg-white p-8 rounded-[2rem] border shadow-sm">
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Marketing Campaigns</h1>
                            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Manage ads & leads</p>
                        </div>
                        <Link href="/academy/campaign/create" className="bg-blue-700 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-lg">
                            + New Campaign
                        </Link>
                    </header>

                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center p-10">Loading...</div>
                        ) : campaigns.length > 0 ? (
                            campaigns.map(camp => (
                                <div key={camp._id} className="bg-white p-6 rounded-2xl border shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-bold text-lg text-gray-900">{camp.name}</h3>
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-black ${camp.status === 'active' ? 'bg-green-100 text-green-700' :
                                                    camp.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>{camp.status}</span>
                                            </div>
                                            <p className="text-xs text-gray-400 font-bold uppercase mt-1">Goal: {camp.type.replace('_', ' ')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-gray-900">₹{camp.budget}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Budget</p>
                                        </div>
                                    </div>

                                    {/* Stats Bar */}
                                    <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl">
                                        <div className="text-center">
                                            <p className="text-xl font-black text-blue-900">{camp.views}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Views</p>
                                        </div>
                                        <div className="text-center border-l border-gray-200">
                                            <p className="text-xl font-black text-blue-900">{camp.clicks}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Clicks</p>
                                        </div>
                                        <div className="text-center border-l border-gray-200">
                                            <p className="text-xl font-black text-green-600">{camp.leads?.length || 0}</p>
                                            <p className="text-[10px] text-gray-400 uppercase font-bold">Leads</p>
                                        </div>
                                    </div>

                                    {camp.leads?.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <p className="text-xs font-bold text-gray-700 mb-2">Recent Leads:</p>
                                            {/* In a real app, map leads here if populated. If IDs only, count is enough */}
                                            <p className="text-xs text-gray-500 italic">View detailed leads in Leads Manager.</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-300">
                                <p className="text-gray-400 font-bold mb-4">No campaigns found.</p>
                                <Link href="/academy/campaign/create" className="text-blue-600 font-black uppercase text-xs tracking-widest hover:underline">Launch your first ad</Link>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
