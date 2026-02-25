'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { API_BASE_URL } from '@/config';
import { FiX } from 'react-icons/fi';

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
                fetch(`${API_BASE_URL}/api/connections/suggestions?search=${searchQuery}`, {
                    headers: { 'Authorization': `Bearer ${currentUser?.token}` }
                }),
                fetch(`${API_BASE_URL}/api/connections`, {
                    headers: { 'Authorization': `Bearer ${currentUser?.token}` }
                }),
                fetch(`${API_BASE_URL}/api/connections/pending`, {
                    headers: { 'Authorization': `Bearer ${currentUser?.token}` }
                }),
                fetch(`${API_BASE_URL}/api/connections/sent`, {
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
            fetch(`${API_BASE_URL}/api/connections/mark-seen`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${currentUser?.token}` }
            }).then(() => {
                window.dispatchEvent(new Event('notificationsUpdated'));
            }).catch(console.error);
        }
    }, [currentUser, searchQuery]);

    const handleConnect = async (targetId: string) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/connections/request`, {
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
            const res = await fetch(`${API_BASE_URL}/api/connections/withdraw/${requestId}`, {
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
            const res = await fetch(`${API_BASE_URL}/api/connections/respond`, {
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
            <main className="max-w-7xl mx-auto pt-4 md:pt-6 px-3 md:px-6 pb-10 flex flex-col md:flex-row gap-6">
                <Sidebar />

                <div className="flex-1 space-y-4 md:space-y-6">
                    {/* Header Card with Navigation */}
                    <div className="bg-white rounded-2xl md:rounded-3xl border shadow-sm p-3 md:p-4 space-y-4">
                        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
                            {/* Horizontal Scrollable Tabs */}
                            <div className="overflow-x-auto no-scrollbar -mx-1 px-1 md:mx-0 md:px-0">
                                <div className="flex bg-gray-100 p-1 rounded-xl w-max md:w-auto min-w-full">
                                    <button
                                        onClick={() => setActiveTab('suggestions')}
                                        className={`whitespace-nowrap flex-1 md:flex-none px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl font-bold md:font-black uppercase text-[9px] md:text-[10px] tracking-tight md:tracking-widest transition-all ${activeTab === 'suggestions' ? 'bg-white text-[#1a237e] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {t('network.tabs.discover')}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('connections')}
                                        className={`whitespace-nowrap flex-1 md:flex-none px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl font-bold md:font-black uppercase text-[9px] md:text-[10px] tracking-tight md:tracking-widest transition-all ${activeTab === 'connections' ? 'bg-white text-[#1a237e] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {t('network.tabs.my_network')} ({connections.length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('pending')}
                                        className={`whitespace-nowrap flex-1 md:flex-none px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl font-bold md:font-black uppercase text-[9px] md:text-[10px] tracking-tight md:tracking-widest transition-all relative ${activeTab === 'pending' ? 'bg-white text-[#1a237e] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {t('network.tabs.requests')}
                                        {pendingRequests.length > 0 && (
                                            <span className="absolute -top-1 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border-2 border-white">
                                                {pendingRequests.length}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('sent')}
                                        className={`whitespace-nowrap flex-1 md:flex-none px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl font-bold md:font-black uppercase text-[9px] md:text-[10px] tracking-tight md:tracking-widest transition-all relative ${activeTab === 'sent' ? 'bg-white text-[#1a237e] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {t('network.tabs.sent')}
                                        {sentRequests.length > 0 && (
                                            <span className="absolute -top-1 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white border-2 border-white">
                                                {sentRequests.length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {activeTab === 'suggestions' && (
                                <div className="relative w-full lg:w-64">
                                    <input
                                        type="text"
                                        placeholder={t('network.search_placeholder')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-100 py-2 md:py-2.5 pl-10 pr-4 rounded-xl outline-none focus:border-blue-600 focus:bg-white transition-all text-xs font-bold"
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
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                            {/* Suggestions View */}
                            {activeTab === 'suggestions' && suggestions.map((u) => (
                                <div key={u._id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 relative">
                                    {/* Dismiss Button */}
                                    <button className="absolute top-2 right-2 z-20 w-6 h-6 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white transition-colors">
                                        <FiX size={14} />
                                    </button>

                                    {/* Banner */}
                                    <div className="h-16 bg-gradient-to-br from-[#1a237e] to-[#3949ab] relative">
                                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                                    </div>

                                    {/* Content */}
                                    <div className="px-3 pb-4 text-center relative">
                                        {/* Profile Picture */}
                                        <div className="mx-auto -mt-10 mb-2 p-0.5 bg-white rounded-full shadow-sm w-20 h-20 overflow-hidden">
                                            {u?.profilePic ? (
                                                <img src={u.profilePic} className="w-full h-full object-cover rounded-full" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-50 font-black text-[#1a237e] text-xl uppercase rounded-full">
                                                    {u?.name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>

                                        <Link href={`/profile/${u._id}`} className="block text-[13px] font-bold text-gray-900 tracking-tight hover:text-blue-700 transition line-clamp-1">
                                            {u.name}
                                        </Link>

                                        <p className="text-[10px] text-gray-500 font-medium line-clamp-2 h-7 mt-0.5 mb-2 leading-tight">
                                            {u.about || t('network.karnataka_aspirant')}
                                        </p>

                                        {/* Mutual Connections (Placeholder) */}
                                        <div className="flex items-center justify-center gap-1 mb-3 opacity-60">
                                            <div className="flex -space-x-1.5">
                                                <div className="w-3 h-3 rounded-full bg-gray-200 border border-white"></div>
                                                <div className="w-3 h-3 rounded-full bg-gray-300 border border-white"></div>
                                            </div>
                                            <span className="text-[8px] text-gray-400 font-bold uppercase">Mutual</span>
                                        </div>

                                        {/* Action Button */}
                                        <div className="mt-auto">
                                            {u.connectionStatus === 'none' && (
                                                <button
                                                    onClick={() => handleConnect(u._id)}
                                                    className="w-full py-1.5 border-2 border-[#1a237e] text-[#1a237e] rounded-full text-[11px] font-black uppercase tracking-tight hover:bg-blue-50 transition-all active:scale-95"
                                                >
                                                    {t('network.connect')}
                                                </button>
                                            )}
                                            {u.connectionStatus === 'sent' && (
                                                <button
                                                    onClick={() => u.requestId && handleWithdraw(u.requestId, u._id)}
                                                    className="w-full py-1.5 bg-gray-100 text-gray-500 rounded-full text-[11px] font-black uppercase tracking-tight hover:bg-red-50 hover:text-red-500 transition-all border border-transparent"
                                                >
                                                    {t('network.withdraw')}
                                                </button>
                                            )}
                                            {u.connectionStatus === 'received' && (
                                                <button
                                                    onClick={() => setActiveTab('pending')}
                                                    className="w-full py-1.5 bg-green-50 text-green-700 rounded-full text-[11px] font-black uppercase tracking-tight hover:bg-green-100 transition-all border border-green-100"
                                                >
                                                    {t('network.review')}
                                                </button>
                                            )}
                                            {u.connectionStatus === 'connected' && (
                                                <Link
                                                    href={`/profile/${u._id}`}
                                                    className="block w-full py-1.5 border-2 border-gray-200 text-gray-500 rounded-full text-[11px] font-black uppercase tracking-tight hover:bg-gray-50 transition-all"
                                                >
                                                    {t('network.connected')}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Connections View */}
                            {activeTab === 'connections' && connections.map((u) => (
                                <div key={u._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center text-center hover:shadow-md transition-all">
                                    <div className="w-16 h-16 rounded-full bg-gray-50 border overflow-hidden flex-shrink-0 mb-3">
                                        {u.profilePic ? (
                                            <img src={u.profilePic} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center font-black text-[#1a237e] text-lg uppercase">
                                                {u.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 w-full">
                                        <Link href={`/profile/${u._id}`} className="block font-bold text-gray-900 tracking-tight hover:text-blue-700 transition truncate text-sm">
                                            {u.name}
                                        </Link>
                                        <p className="text-[10px] font-medium text-gray-400 mt-0.5 mb-4">{t('network.aspirant_network')}</p>
                                    </div>
                                    <Link
                                        href={`/messages?user=${u._id}`}
                                        className="w-full py-1.5 border-2 border-blue-600 text-blue-600 rounded-full text-[11px] font-black uppercase tracking-tight hover:bg-blue-50 transition-all text-center"
                                    >
                                        Message
                                    </Link>
                                </div>
                            ))}

                            {/* Pending Requests View */}
                            {activeTab === 'pending' && pendingRequests.map((r) => (
                                <div key={r._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center flex flex-col items-center">
                                    <div className="mb-3 w-16 h-16 rounded-full border-2 border-blue-100 p-0.5">
                                        {r?.requester?.profilePic ? (
                                            <img src={r.requester.profilePic} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-full font-black text-[#1a237e] text-lg uppercase">
                                                {r?.requester?.name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-gray-900 tracking-tight text-sm line-clamp-1">{r?.requester?.name || 'Unknown Aspirant'}</h3>
                                    <p className="text-[10px] font-medium text-blue-600 mt-0.5 mb-4 uppercase tracking-tighter">{t('network.requesting')}</p>

                                    <div className="grid grid-cols-1 gap-2 w-full mt-auto">
                                        <button
                                            onClick={() => handleResponse(r._id, 'accepted')}
                                            className="py-1.5 bg-[#1a237e] text-white rounded-full text-[11px] font-black uppercase tracking-tight hover:bg-black transition-all"
                                        >
                                            {t('network.accept')}
                                        </button>
                                        <button
                                            onClick={() => handleResponse(r._id, 'rejected')}
                                            className="py-1.5 border-2 border-gray-200 text-gray-500 rounded-full text-[11px] font-black uppercase tracking-tight hover:bg-gray-50 transition-all"
                                        >
                                            {t('network.ignore')}
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Sent Requests View */}
                            {activeTab === 'sent' && sentRequests.map((r) => (
                                <div key={r._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center flex flex-col items-center">
                                    <div className="mb-3 w-16 h-16 rounded-full border-2 border-blue-100 p-0.5">
                                        {r?.recipient?.profilePic ? (
                                            <img src={r.recipient.profilePic} className="w-full h-full object-cover rounded-full" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-full font-black text-[#1a237e] text-lg uppercase">
                                                {r?.recipient?.name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-gray-900 tracking-tight text-sm line-clamp-1">{r?.recipient?.name || 'Unknown Aspirant'}</h3>
                                    <p className="text-[10px] font-medium text-gray-400 mt-0.5 mb-4 uppercase tracking-tighter">Sent Request</p>

                                    <button
                                        onClick={() => handleWithdraw(r._id, r.recipient?._id)}
                                        className="w-full mt-auto py-1.5 border-2 border-red-200 text-red-500 rounded-full text-[11px] font-black uppercase tracking-tight hover:bg-red-50 transition-all"
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
