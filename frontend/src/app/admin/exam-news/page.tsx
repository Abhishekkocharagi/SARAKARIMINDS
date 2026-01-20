'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface ExamNews {
    _id: string;
    title: string;
    description: string;
    hashtags: string[];
    status: 'published' | 'draft';
    createdAt: string;
}

export default function AdminExamNews() {
    const { user } = useAuth();
    const [news, setNews] = useState<ExamNews[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<ExamNews | null>(null);

    // Form states
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        hashtags: '',
        status: 'published'
    });

    useEffect(() => {
        if (user?.token) {
            fetchNews();
        }
    }, [user]);

    const fetchNews = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/exam-news/all', {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNews(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const url = editingItem
            ? `http://localhost:5000/api/admin/exam-news/${editingItem._id}`
            : 'http://localhost:5000/api/admin/exam-news';
        const method = editingItem ? 'PUT' : 'POST';

        const payload = {
            ...formData,
            hashtags: formData.hashtags.split(',').map(tag => tag.trim().startsWith('#') ? tag.trim() : `#${tag.trim()}`)
        };

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                alert(editingItem ? 'News updated!' : 'News created!');
                setShowModal(false);
                setEditingItem(null);
                resetForm();
                fetchNews();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteNews = async (id: string) => {
        if (!confirm('Are you sure you want to delete this news item?')) return;
        try {
            const res = await fetch(`http://localhost:5000/api/admin/exam-news/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                fetchNews();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            description: '',
            hashtags: '',
            status: 'published'
        });
    };

    const openEdit = (item: ExamNews) => {
        setEditingItem(item);
        setFormData({
            title: item.title,
            description: item.description,
            hashtags: item.hashtags.join(', '),
            status: item.status
        });
        setShowModal(true);
    };

    if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading Exam News...</div>;

    return (
        <div>
            <header className="mb-10 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Exam News Console</h1>
                    <p className="text-gray-500 mt-2 font-medium">Post official exam updates and targeted notifications.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setEditingItem(null); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 py-3 rounded-2xl transition shadow-lg shadow-blue-500/20 uppercase text-xs tracking-widest"
                >
                    + Post Update
                </button>
            </header>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <th className="px-8 py-6">News Title</th>
                            <th className="px-8 py-6">Hashtags</th>
                            <th className="px-8 py-6">Status</th>
                            <th className="px-8 py-6">Posted</th>
                            <th className="px-8 py-6 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {news.map((item) => (
                            <tr key={item._id} className="hover:bg-gray-50 transition group">
                                <td className="px-8 py-6">
                                    <p className="font-bold text-gray-900 border-l-4 border-blue-500 pl-3">{item.title}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-wrap gap-1">
                                        {item.hashtags.map((h, i) => (
                                            <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">{h}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${item.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-sm text-gray-500 font-medium">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-8 py-6 text-right space-x-2">
                                    <button onClick={() => openEdit(item)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition">✏️</button>
                                    <button onClick={() => deleteNews(item._id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition">🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {news.length === 0 && (
                    <div className="p-20 text-center opacity-30">
                        <p className="text-4xl mb-4">📰</p>
                        <p className="font-bold uppercase tracking-widest">No exam news posted yet</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-2xl font-black text-gray-900">{editingItem ? 'Edit Exam Update' : 'New Exam Update'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900 transition text-2xl">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Headline</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    placeholder="e.g. KPSC KAS 2026 Notification Released"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Detailed News</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition h-32 resize-none"
                                    placeholder="Full details of the exam update..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Target Hashtags (comma separated)</label>
                                <input
                                    type="text"
                                    value={formData.hashtags}
                                    onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                                    placeholder="KPSCKAS, FDA, SDA"
                                    required
                                />
                                <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase italic">Users with matching preferences will see this news.</p>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition font-bold"
                                >
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                            <div className="pt-6 flex gap-4">
                                <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition shadow-xl shadow-blue-500/30 uppercase tracking-widest text-sm">
                                    {editingItem ? 'Save Changes' : 'Broadcast Now'}
                                </button>
                                <button type="button" onClick={() => setShowModal(false)} className="px-8 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black py-4 rounded-2xl transition uppercase tracking-widest text-sm">
                                    Discard
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
