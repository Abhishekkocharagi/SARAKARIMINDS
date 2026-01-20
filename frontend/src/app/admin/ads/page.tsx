'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Ad {
    _id: string;
    title: string;
    description: string;
    imageUrl: string;
    redirectUrl: string;
    slot: 'FEED_INLINE' | 'SIDEBAR_EXAM';
    status: 'active' | 'paused';
    startDate: string;
    endDate: string;
    priority: number;
    createdAt: string;
}

export default function AdminAds() {
    const { user } = useAuth();
    const [ads, setAds] = useState<Ad[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAd, setEditingAd] = useState<Ad | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        imageUrl: '',
        redirectUrl: '',
        slot: 'FEED_INLINE',
        startDate: '',
        endDate: '',
        priority: 0
    });

    useEffect(() => {
        if (user?.token) {
            fetchAds();
        }
    }, [user]);

    const fetchAds = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/ads', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setAds(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingAd
            ? `http://localhost:5000/api/admin/ads/${editingAd._id}`
            : 'http://localhost:5000/api/admin/ads/create';
        const method = editingAd ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                alert(editingAd ? 'Ad updated!' : 'Ad created!');
                setShowModal(false);
                setEditingAd(null);
                resetForm();
                fetchAds();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteAd = async (id: string) => {
        if (!confirm('Are you sure you want to delete this ad?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/admin/ads/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                fetchAds();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleStatus = async (ad: Ad) => {
        const newStatus = ad.status === 'active' ? 'paused' : 'active';
        try {
            const res = await fetch(`http://localhost:5000/api/admin/ads/${ad._id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                fetchAds();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            imageUrl: '',
            redirectUrl: '',
            slot: 'FEED_INLINE',
            startDate: '',
            endDate: '',
            priority: 0
        });
    };

    const openEdit = (ad: Ad) => {
        setEditingAd(ad);
        setFormData({
            title: ad.title,
            description: ad.description,
            imageUrl: ad.imageUrl,
            redirectUrl: ad.redirectUrl,
            slot: ad.slot,
            startDate: ad.startDate.split('T')[0],
            endDate: ad.endDate.split('T')[0],
            priority: ad.priority
        });
        setShowModal(true);
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading Ads Manager...</div>;

    return (
        <div>
            <header className="mb-10 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Ads Management</h1>
                    <p className="text-gray-500 mt-2 font-medium">Create and monitor promoted content across the platform.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setEditingAd(null); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-2xl transition shadow-lg shadow-blue-500/20 uppercase text-xs tracking-widest"
                >
                    + Create New Ad
                </button>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {ads.map((ad) => (
                    <div key={ad._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-6 group hover:shadow-xl transition-all duration-300">
                        <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                            <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-xl font-bold text-gray-900">{ad.title}</h3>
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${ad.slot === 'FEED_INLINE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                    }`}>
                                    {ad.slot}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-2">{ad.description}</p>
                            <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-400">
                                <span>📅 {new Date(ad.startDate).toLocaleDateString()} - {new Date(ad.endDate).toLocaleDateString()}</span>
                                <span>🔥 Priority: {ad.priority}</span>
                                <span className={ad.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                                    ● {ad.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => toggleStatus(ad)} className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition border border-gray-100" title="Toggle Status">
                                {ad.status === 'active' ? '⏸️' : '▶️'}
                            </button>
                            <button onClick={() => openEdit(ad)} className="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition border border-gray-100" title="Edit">
                                ✏️
                            </button>
                            <button onClick={() => deleteAd(ad._id)} className="p-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition border border-red-100" title="Delete">
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}

                {ads.length === 0 && (
                    <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center opacity-50">
                        <span className="text-6xl mb-4">📢</span>
                        <p className="font-bold uppercase tracking-widest text-gray-400">No ads active right now.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-2xl font-black text-gray-900">{editingAd ? 'Edit Advertisement' : 'Create New Advertisement'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900 transition text-2xl">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Ad Title (Brand Name)</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                        placeholder="e.g. Namma Academy"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition h-24 resize-none"
                                        placeholder="Describe the promotion..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Image / Logo URL</label>
                                    <input
                                        type="url"
                                        value={formData.imageUrl}
                                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                                        placeholder="https://example.com/logo.png"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Redirect URL</label>
                                    <input
                                        type="url"
                                        value={formData.redirectUrl}
                                        onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm"
                                        placeholder="https://example.com/landing"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Placement Slot</label>
                                    <select
                                        value={formData.slot}
                                        onChange={(e) => setFormData({ ...formData, slot: e.target.value as any })}
                                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-bold text-sm"
                                    >
                                        <option value="FEED_INLINE">Feed Inline</option>
                                        <option value="SIDEBAR_EXAM">Sidebar (Below News)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Priority</label>
                                    <input
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">End Date</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="pt-6 flex gap-4">
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition shadow-xl shadow-blue-500/30 uppercase tracking-widest text-sm">
                                    {editingAd ? 'Update Advertisement' : 'Launch Advertisement'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="px-8 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black py-4 rounded-2xl transition uppercase tracking-widest text-sm">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
