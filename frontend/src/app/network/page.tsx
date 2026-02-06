'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';

interface NetworkUser {
    _id: string;
    name: string;
    profilePic: string;
    accountType: string;
    about: string;
    connectionStatus: 'none' | 'sent' | 'received' | 'connected';
    requestId?: string;
}

interface PendingRequest {
    _id: string;
    requester: {
        _id: string;
        name: string;
        profilePic: string;
        accountType: string;
    };
}

interface SentRequest {
    _id: string;
    recipient: {
        _id: string;
        name: string;
        profilePic: string;
        accountType: string;
    };
}

export default function NetworkPage() {
    const { user: currentUser } = useAuth();
    const { t } = useLanguage();
    const [suggestions, setSuggestions] = useState<NetworkUser[]>([]);
    const [connections, setConnections] = useState<NetworkUser[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'suggestions' | 'connections' | 'pending' | 'sent'>('suggestions');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        if (!currentUser) return;
        try {
            const [sugRes, connRes, pendRes, sentRes] = await Promise.all([
                fetch(`http://localhost:5000/api/connections/suggestions?search=${searchQuery}`, {
                    headers: { 'Authorization': `Bearer ${currentUser?.token}` }
                }),
                fetch('http://localhost:5000/api/connections', {
                    headers: { 'Authorization': `Bearer ${currentUser?.token}` }
                }),
                fetch('http://localhost:5000/api/connections/pending', {
                    headers: { 'Authorization': `Bearer ${currentUser?.token}` }
                }),
                fetch('http://localhost:5000/api/connections/sent', {
                    headers: { 'Authorization': `Bearer ${currentUser?.token}` }
                })
            ]);

            const sugData = await sugRes.json();
            const connData = await connRes.json();
            const pendData = await pendRes.json();
            const sentData = await sentRes.json();

            // Deduplicate and filter out nulls
            if (Array.isArray(sugData)) {
                const unique = sugData.filter(Boolean).filter((v: any, i: any, a: any) => a.findIndex((t: any) => t._id === v._id) === i);
                setSuggestions(unique);
            }
            if (Array.isArray(connData)) {
                const unique = connData.filter((c: any) => !!c).filter((v: any, i: any, a: any) => a.findIndex((t: any) => t._id === v._id) === i);
                setConnections(unique);
            }
            if (Array.isArray(pendData)) {
                const unique = pendData.filter((r: any) => !!r && !!r.requester).filter((v: any, i: any, a: any) => a.findIndex((t: any) => t._id === v._id) === i);
                setPendingRequests(unique);
            }
            if (Array.isArray(sentData)) {
                const unique = sentData.filter((r: any) => !!r && !!r.recipient).filter((v: any, i: any, a: any) => a.findIndex((t: any) => t._id === v._id) === i);
                setSentRequests(unique);
            }
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => {
        if (currentUser) {
            fetchData();
            // Clear network badge when visiting this page
            fetch('http://localhost:5000/api/connections/mark-seen', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${currentUser?.token}` }
            }).then(() => {
                window.dispatchEvent(new Event('notificationsUpdated'));
            }).catch(console.error);
        }
    }, [currentUser, searchQuery]);

    const handleConnect = async (targetId: string) => {
        try {
            const res = await fetch('http://localhost:5000/api/connections/request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser?.token}`
                },
                body: JSON.stringify({ recipientId: targetId })
            });
            if (res.ok) {
                setSuggestions(suggestions.map(s =>
                    s._id === targetId ? { ...s, connectionStatus: 'sent' } : s
                ));
            }
        } catch (err) { console.error(err); }
    };

    const handleWithdraw = async (requestId: string, targetId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/connections/withdraw/${requestId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${currentUser?.token}` }
            });
            if (res.ok) {
                // Update local state to reflect withdrawn status
                setSuggestions(prev => prev.map(s =>
                    s._id === targetId ? { ...s, connectionStatus: 'none', requestId: undefined } : s
                ));
                setSentRequests(prev => prev.filter(r => r._id !== requestId));
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to withdraw request');
            }
        } catch (err) {
            console.error(err);
            alert('Error withdrawing request');
        } finally {
            setLoading(false);
        }
    };

    const handleResponse = async (requestId: string, status: 'accepted' | 'rejected') => {
        try {
            const res = await fetch('http://localhost:5000/api/connections/respond', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentUser?.token}`
                },
                body: JSON.stringify({ requestId, status })
            });
            if (res.ok) {
                setPendingRequests(pendingRequests.filter(r => r._id !== requestId));
                fetchData(); // Refresh everything
            }
        } catch (err) { console.error(err); }
    };

    return (
        <div className="min-h-screen bg-[#F3F2EF]">
            <Navbar />
            <main className="max-w-7xl mx-auto pt-6 px-6 pb-10 flex flex-col md:flex-row gap-6">
                <div className="hidden md:block w-[280px] shrink-0">
                    <Sidebar />
                </div>

                <div className="flex-1 space-y-6">
                    {/* Header Card with Navigation */}
                    <div className="bg-white rounded-3xl border shadow-sm p-4 space-y-4">
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full md:w-auto">
                                <button
                                    onClick={() => setActiveTab('suggestions')}
                                    className={`px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'suggestions' ? 'bg-white text-[#1a237e] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {t('network.tabs.discover')}
                                </button>
                                <button
                                    onClick={() => setActiveTab('connections')}
                                    className={`px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === 'connections' ? 'bg-white text-[#1a237e] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {t('network.tabs.my_network')} ({connections.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('pending')}
                                    className={`px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all relative ${activeTab === 'pending' ? 'bg-white text-[#1a237e] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {t('network.tabs.requests')}
                                    {pendingRequests.length > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white">
                                            {pendingRequests.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setActiveTab('sent')}
                                    className={`px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all relative ${activeTab === 'sent' ? 'bg-white text-[#1a237e] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                >
                                    {t('network.tabs.sent')}
                                    {sentRequests.length > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">
                                            {sentRequests.length}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {activeTab === 'suggestions' && (
                                <div className="relative w-full md:w-64">
                                    <input
                                        type="text"
                                        placeholder={t('network.search_placeholder')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 py-2.5 pl-10 pr-4 rounded-xl outline-none focus:border-blue-600 focus:bg-white transition-all text-xs font-bold"
                                    />
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-xs">🔍</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-white h-64 rounded-3xl border"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Suggestions View */}
                            {activeTab === 'suggestions' && suggestions.map((u) => (
                                <div key={u._id} className="bg-white rounded-3xl border shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300">
                                    <div className="h-24 bg-gradient-to-br from-[#1a237e] to-[#3949ab] relative">
                                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                    </div>
                                    <div className="px-6 pb-6 text-center relative">
                                        <div className="mx-auto -mt-10 mb-3 p-1 bg-white rounded-full shadow-lg w-20 h-20 overflow-hidden border-2 border-white">
                                            {u?.profilePic ? (
                                                <img src={u.profilePic} className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-50 font-black text-[#1a237e] text-2xl uppercase rounded-full">
                                                    {u?.name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <Link href={`/profile/${u._id}`} className="block text-base font-black text-gray-900 tracking-tight hover:text-blue-700 transition line-clamp-1">
                                            {u.name}
                                        </Link>
                                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1 mb-3">
                                            {t('network.karnataka_aspirant')}
                                        </p>
                                        <p className="text-[11px] text-gray-500 line-clamp-2 font-medium h-8 mb-6 italic leading-relaxed">
                                            {u.about || t('network.about_placeholder')}
                                        </p>

                                        {u.connectionStatus === 'none' && (
                                            <button
                                                onClick={() => handleConnect(u._id)}
                                                className="w-full py-3 bg-[#1a237e] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-blue-900/10 active:scale-95"
                                            >
                                                {t('network.connect')}
                                            </button>
                                        )}
                                        {u.connectionStatus === 'sent' && (
                                            <button
                                                onClick={() => u.requestId && handleWithdraw(u.requestId, u._id)}
                                                className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100"
                                            >
                                                {t('network.withdraw')}
                                            </button>
                                        )}
                                        {u.connectionStatus === 'received' && (
                                            <button
                                                onClick={() => setActiveTab('pending')}
                                                className="w-full py-3 bg-green-50 text-green-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-100 transition-all border border-green-100"
                                            >
                                                {t('network.review')}
                                            </button>
                                        )}
                                        {u.connectionStatus === 'connected' && (
                                            <Link
                                                href={`/profile/${u._id}`}
                                                className="block w-full py-3 bg-white text-blue-700 border-2 border-blue-50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all"
                                            >
                                                {t('network.connected')}
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {/* Connections View */}
                            {activeTab === 'connections' && connections.map((u) => (
                                <div key={u._id} className="bg-white rounded-3xl border shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border overflow-hidden flex-shrink-0">
                                        {u.profilePic ? (
                                            <img src={u.profilePic} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-black text-[#1a237e] text-xl uppercase">
                                                {u.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/profile/${u._id}`} className="block font-black text-gray-900 tracking-tight hover:text-blue-700 transition truncate uppercase text-sm">
                                            {u.name}
                                        </Link>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t('network.aspirant_network')}</p>
                                    </div>
                                    <Link
                                        href={`/messages?user=${u._id}`}
                                        className="p-3 bg-gray-50 text-blue-700 rounded-xl hover:bg-blue-700 hover:text-white transition-all shadow-sm"
                                        title="Message"
                                    >
                                        💬
                                    </Link>
                                </div>
                            ))}

                            {/* Pending Requests View */}
                            {activeTab === 'pending' && pendingRequests.map((r) => (
                                <div key={r._id} className="bg-white rounded-3xl border shadow-sm p-6 text-center">
                                    <div className="mx-auto mb-4 w-20 h-20 rounded-full border-2 border-blue-100 p-1">
                                        {r?.requester?.profilePic ? (
                                            <img src={r.requester.profilePic} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-full font-black text-[#1a237e] text-2xl uppercase">
                                                {r?.requester?.name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-black text-gray-900 tracking-tight uppercase text-sm">{r?.requester?.name || 'Unknown Aspirant'}</h3>
                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-1 mb-4">{t('network.requesting')}</p>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => handleResponse(r._id, 'accepted')}
                                            className="py-2.5 bg-[#1a237e] text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
                                        >
                                            {t('network.accept')}
                                        </button>
                                        <button
                                            onClick={() => handleResponse(r._id, 'rejected')}
                                            className="py-2.5 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
                                        >
                                            {t('network.ignore')}
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Sent Requests View */}
                            {activeTab === 'sent' && sentRequests.map((r) => (
                                <div key={r._id} className="bg-white rounded-3xl border shadow-sm p-6 text-center">
                                    <div className="mx-auto mb-4 w-20 h-20 rounded-full border-2 border-blue-100 p-1">
                                        {r?.recipient?.profilePic ? (
                                            <img src={r.recipient.profilePic} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-full font-black text-[#1a237e] text-2xl uppercase">
                                                {r?.recipient?.name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-black text-gray-900 tracking-tight uppercase text-sm">{r?.recipient?.name || 'Unknown Aspirant'}</h3>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 mb-4">Sent to Aspirant</p>

                                    <button
                                        onClick={() => handleWithdraw(r._id, r.recipient._id)}
                                        className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border-2 border-red-100 active:scale-95"
                                    >
                                        {t('network.withdraw')}
                                    </button>
                                </div>
                            ))}

                            {/* Empty States */}
                            {((activeTab === 'suggestions' && suggestions.length === 0) ||
                                (activeTab === 'connections' && connections.length === 0) ||
                                (activeTab === 'pending' && pendingRequests.length === 0) ||
                                (activeTab === 'sent' && sentRequests.length === 0)) && (
                                    <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-100 text-center">
                                        <p className="text-5xl mb-6 grayscale opacity-50">🛰️</p>
                                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-1">{t('network.empty_title')}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('network.empty_desc')}</p>
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
