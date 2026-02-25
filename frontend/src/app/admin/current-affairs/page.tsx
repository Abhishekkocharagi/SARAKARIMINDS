'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FiTrash2, FiEdit2, FiPlus, FiX, FiCheck, FiCpu, FiMonitor } from 'react-icons/fi';
import { API_BASE_URL } from '@/config';

export default function AdminCurrentAffairsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        shortSummary: '',
        fullSummary: '',
        primaryCategory: 'Auto',
        secondaryCategory: '',
        examRelevance: 'Both',
        difficulty: 'Moderate',
        status: 'Draft',
        source: '',
        pdfUrl: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const categories = ['Auto', 'Polity', 'Economy', 'Science & Technology', 'Environment', 'International Relations', 'Government Schemes', 'Karnataka State Affairs', 'Miscellaneous', 'Sports', 'Awards', 'Appointments'];
    const difficultyLevels = ['Easy', 'Moderate', 'Advanced'];
    const examRelevanceOptions = ['Prelims', 'Mains', 'Both'];
    const statusOptions = ['Draft', 'Publish'];

    useEffect(() => {
        if (!authLoading) {
            if (!user || user.role !== 'admin') {
                router.push('/login');
                return;
            }
            fetchEntries();
        }
    }, [user, authLoading, router]);

    const fetchEntries = async () => {
        try {
            // Fetch all entries for admin (maybe add ?status=All if backend filters by default)
            const res = await fetch(`${API_BASE_URL}/api/current-affairs?status=`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setEntries(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let payload: any = { ...formData };
        if (payload.primaryCategory === 'Auto') {
            const { primaryCategory, ...rest } = payload;
            payload = rest;
        }

        try {
            const url = editingId
                ? `${API_BASE_URL}/api/current-affairs/admin/${editingId}`
                : `${API_BASE_URL}/api/current-affairs/admin`;

            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();

                if (!editingId && data.autoCategorized) {
                    alert(`System Auto-Categorized as: ${data.data.primaryCategory}`);
                } else {
                    alert(editingId ? 'Updated successfully' : 'Added successfully');
                }

                setIsModalOpen(false);
                setEditingId(null);
                resetForm();
                fetchEntries();
            } else {
                const err = await res.json();
                alert(err.message);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to submit');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/current-affairs/admin/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                setEntries(prev => prev.filter(e => e._id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (entry: any) => {
        setFormData({
            title: entry.title,
            shortSummary: entry.shortSummary || '',
            fullSummary: entry.fullSummary || entry.description || '', // Fallback to description
            primaryCategory: entry.primaryCategory || entry.category || 'Miscellaneous',
            secondaryCategory: entry.secondaryCategory || '',
            examRelevance: entry.examRelevance || 'Both',
            difficulty: entry.difficulty || 'Moderate',
            status: entry.status || 'Draft',
            source: entry.source || '',
            pdfUrl: entry.pdfUrl || '',
            date: entry.date.split('T')[0]
        });
        setEditingId(entry._id);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            shortSummary: '',
            fullSummary: '',
            primaryCategory: 'Auto',
            secondaryCategory: '',
            examRelevance: 'Both',
            difficulty: 'Moderate',
            status: 'Draft',
            source: '',
            pdfUrl: '',
            date: new Date().toISOString().split('T')[0]
        });
    };

    if (authLoading || !user) return <div className="p-10 text-center uppercase font-black text-gray-400">Loading Admin Panel...</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900 uppercase tracking-tighter">Current Affairs Manager</h1>
                        <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Smart Upload & Auto-Categorization</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            resetForm();
                            setIsModalOpen(true);
                        }}
                        className="w-full md:w-auto px-6 py-3 bg-gray-900 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-blue-500/30"
                    >
                        <FiPlus size={18} /> New Entry
                    </button>
                </div>

                <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date/Category</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Content</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Relevance</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {entries.map(entry => (
                                    <tr key={entry._id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${entry.status === 'Publish'
                                                ? 'bg-green-50 text-green-600 border-green-200'
                                                : 'bg-yellow-50 text-yellow-600 border-yellow-200'
                                                }`}>
                                                {entry.status || 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold text-gray-900">
                                                    {new Date(entry.date).toLocaleDateString()}
                                                </span>
                                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                                    {entry.primaryCategory || entry.category}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 max-w-md">
                                            <p className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-blue-600 transition-colors">{entry.title}</p>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{entry.shortSummary || entry.description}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1 flex-wrap">
                                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold uppercase">{entry.difficulty}</span>
                                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold uppercase">{entry.examRelevance}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(entry)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <FiEdit2 />
                                                </button>
                                                <button onClick={() => handleDelete(entry._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {entries.map(entry => (
                            <div key={entry._id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${entry.status === 'Publish'
                                        ? 'bg-green-50 text-green-600 border-green-200'
                                        : 'bg-yellow-50 text-yellow-600 border-yellow-200'
                                        }`}>
                                        {entry.status || 'Draft'}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEdit(entry)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                            <FiEdit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(entry._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                            <FiTrash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm line-clamp-2">{entry.title}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-[10px] font-bold text-gray-400">{new Date(entry.date).toLocaleDateString()}</span>
                                        <span className="text-[10px] text-gray-300">•</span>
                                        <span className="text-[10px] font-bold text-blue-600 uppercase">{entry.primaryCategory || entry.category}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1 flex-wrap">
                                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold uppercase">{entry.difficulty}</span>
                                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-bold uppercase">{entry.examRelevance}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col md:flex-row overflow-hidden">

                        {/* Sidebar / Info */}
                        <div className="w-full md:w-1/3 bg-gray-50 p-8 border-r border-gray-100 hidden md:block">
                            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-4">Entry Details</h3>
                            <p className="text-xs text-gray-500 mb-8 leading-relaxed">
                                Fill in the details to create a smart current affairs entry. Use the "Auto" category to let the system decide based on keywords.
                            </p>

                            <div className="space-y-6">
                                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2 text-blue-600">
                                        <FiCpu />
                                        <span className="text-[10px] font-black uppercase tracking-widest">AI Categorization</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400">Leave Primary Category as "Auto" to enable smart keyword detection.</p>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="flex-1 p-8 overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">
                                    {editingId ? 'Edit Entry' : 'New Entry'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition">
                                    <FiX size={24} className="text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Title & Date */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Headline</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-bold text-gray-900"
                                            placeholder="Enter news headline..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Date</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-medium text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Summaries */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Short Summary (Bullet Points)</label>
                                    <textarea
                                        value={formData.shortSummary}
                                        onChange={e => setFormData({ ...formData, shortSummary: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition h-24 text-sm font-medium"
                                        placeholder="- Point 1&#10;- Point 2&#10;- Point 3"
                                        required
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Full Detailed Summary</label>
                                    <textarea
                                        value={formData.fullSummary}
                                        onChange={e => setFormData({ ...formData, fullSummary: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition h-48 text-sm leading-relaxed"
                                        placeholder="Enter detailed analysis here..."
                                        required
                                    ></textarea>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Category</label>
                                        <select
                                            value={formData.primaryCategory}
                                            onChange={e => setFormData({ ...formData, primaryCategory: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-xs font-bold text-gray-700"
                                        >
                                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Relevance</label>
                                        <select
                                            value={formData.examRelevance}
                                            onChange={e => setFormData({ ...formData, examRelevance: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-xs font-bold text-gray-700"
                                        >
                                            {examRelevanceOptions.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Difficulty</label>
                                        <select
                                            value={formData.difficulty}
                                            onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-xs font-bold text-gray-700"
                                        >
                                            {difficultyLevels.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                                            className={`w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-xs font-bold ${formData.status === 'Publish' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-700'
                                                }`}
                                        >
                                            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Source & Link */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Source (Optional)</label>
                                        <input
                                            type="text"
                                            value={formData.source}
                                            onChange={e => setFormData({ ...formData, source: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-xs"
                                            placeholder="The Hindu, PIB, etc."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">PDF/Resource URL (Optional)</label>
                                        <input
                                            type="url"
                                            value={formData.pdfUrl}
                                            onChange={e => setFormData({ ...formData, pdfUrl: e.target.value })}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-xs"
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    <FiCheck size={18} /> {editingId ? 'Update & Save' : 'Save Entry'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
