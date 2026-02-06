'use client';

import React, { useState, useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { FiTrash2, FiEdit2, FiPlus, FiX } from 'react-icons/fi';

export default function AdminCurrentAffairsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 'National',
        relatedExams: '', // comma separated string for input
        pdfUrl: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const categories = ['National', 'Karnataka', 'International', 'Economy', 'Science & Tech', 'Polity', 'Sports', 'Awards', 'Appointments', 'Other'];

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
            const res = await fetch('http://localhost:5000/api/current-affairs', {
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

        const payload = {
            ...formData,
            relatedExams: formData.relatedExams.split(',').map(s => s.trim()).filter(Boolean)
        };

        try {
            const url = editingId
                ? `http://localhost:5000/api/current-affairs/admin/${editingId}`
                : 'http://localhost:5000/api/current-affairs/admin';

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
                alert(editingId ? 'Updated successfully' : 'Added successfully');
                setIsModalOpen(false);
                setEditingId(null);
                setFormData({
                    title: '',
                    description: '',
                    category: 'National',
                    relatedExams: '',
                    pdfUrl: '',
                    date: new Date().toISOString().split('T')[0]
                });
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
            const res = await fetch(`http://localhost:5000/api/current-affairs/admin/${id}`, {
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
            description: entry.description,
            category: entry.category,
            relatedExams: entry.relatedExams.join(', '),
            pdfUrl: entry.pdfUrl || '',
            date: entry.date.split('T')[0]
        });
        setEditingId(entry._id);
        setIsModalOpen(true);
    };

    if (authLoading || !user) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar Removed */}
            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-black text-gray-900">Current Affairs Management</h1>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setFormData({
                                title: '',
                                description: '',
                                category: 'National',
                                relatedExams: '',
                                pdfUrl: '',
                                date: new Date().toISOString().split('T')[0]
                            });
                            setIsModalOpen(true);
                        }}
                        className="px-6 py-3 bg-blue-700 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-black transition-all flex items-center gap-2"
                    >
                        <FiPlus /> Add New Entry
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Date</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Title</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Category</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Stats</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {entries.map(entry => (
                                    <tr key={entry._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-xs font-bold text-gray-500 whitespace-nowrap">
                                            {new Date(entry.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900 text-sm line-clamp-1">{entry.title}</p>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-1">{entry.description}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-[10px] font-black uppercase tracking-widest">
                                                {entry.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            <div className="flex gap-3">
                                                <span title="Reads">👁️ {entry.reads?.length || 0}</span>
                                                <span title="Saves">🔖 {entry.saves?.length || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
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
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-8 border-b flex justify-between items-center bg-gray-50 sticky top-0">
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
                                {editingId ? 'Edit Entry' : 'Add New Current Affair'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <FiX size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-bold"
                                    placeholder="Enter headline..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition h-32"
                                    placeholder="Short summary (3-4 lines)..."
                                    required
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Related Exams (Comma separated)</label>
                                <input
                                    type="text"
                                    value={formData.relatedExams}
                                    onChange={e => setFormData({ ...formData, relatedExams: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    placeholder="e.g. KAS, FDA, PSI (Optional)"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">PDF URL (Optional)</label>
                                <input
                                    type="url"
                                    value={formData.pdfUrl}
                                    onChange={e => setFormData({ ...formData, pdfUrl: e.target.value })}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    placeholder="https://..."
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-blue-700 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all shadow-xl shadow-blue-500/20"
                            >
                                {editingId ? 'Update Entry' : 'Publish Entry'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
