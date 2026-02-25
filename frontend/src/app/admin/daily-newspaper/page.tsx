'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/config';

export default function AdminDailyNewspaperPage() {
    const { user } = useAuth();
    const [newspapers, setNewspapers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNewspaper, setEditingNewspaper] = useState<any>(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        date: new Date().toISOString().split('T')[0],
        fileType: 'pdf' as 'pdf' | 'image',
        thumbnailUrl: '',
        summary: '',
        status: 'approved' as 'pending' | 'approved' | 'rejected'
    });

    useEffect(() => {
        fetchNewspapers();
    }, []);

    const fetchNewspapers = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/daily-newspapers/admin/all`, {
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNewspapers(data);
            }
        } catch (error) {
            console.error('Failed to fetch newspapers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const url = editingNewspaper
                ? `${API_BASE_URL}/api/daily-newspapers/admin/${editingNewspaper._id}`
                : `${API_BASE_URL}/api/daily-newspapers/admin`;

            const method = editingNewspaper ? 'PUT' : 'POST';

            const data = new FormData();
            data.append('name', formData.name);
            data.append('date', formData.date);
            data.append('summary', formData.summary);
            data.append('status', formData.status);
            data.append('isVisible', 'true');

            if (selectedFile) {
                data.append('file', selectedFile);
                data.append('fileType', formData.fileType);
            }
            if (formData.thumbnailUrl) data.append('thumbnailUrl', formData.thumbnailUrl);

            const res = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${user?.token}`
                },
                body: data
            });

            if (res.ok) {
                await fetchNewspapers();
                handleCloseModal();
                alert(editingNewspaper ? 'News updated successfully!' : 'News entry created!');
            } else {
                const errorData = await res.json();
                alert(errorData.message || 'Failed to save news');
            }
        } catch (error) {
            console.error('Error saving news:', error);
            alert('Error saving news');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this news entry?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/daily-newspapers/admin/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });

            if (res.ok) {
                await fetchNewspapers();
                alert('Deleted successfully!');
            }
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const handleEdit = (newspaper: any) => {
        setEditingNewspaper(newspaper);
        setFormData({
            name: newspaper.name,
            date: new Date(newspaper.date).toISOString().split('T')[0],
            fileType: newspaper.fileType || 'pdf',
            thumbnailUrl: newspaper.thumbnailUrl || '',
            summary: newspaper.summary || '',
            status: newspaper.status || 'approved'
        });
        setPreviewUrl(newspaper.fileUrl || '');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingNewspaper(null);
        setSelectedFile(null);
        setFormData({
            name: '',
            date: new Date().toISOString().split('T')[0],
            fileType: 'pdf',
            thumbnailUrl: '',
            summary: '',
            status: 'approved'
        });
        setPreviewUrl('');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);

            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => setPreviewUrl(e.target?.result as string);
                reader.readAsDataURL(file);
                setFormData(prev => ({ ...prev, fileType: 'image' }));
            } else {
                setFormData(prev => ({ ...prev, fileType: 'pdf' }));
                setPreviewUrl('');
            }
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                        <span className="text-4xl">🗞️</span> Exam News Manager
                    </h1>
                    <p className="text-sm text-gray-500 mt-1 font-medium">Post topic-wise summarized news for government exams</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-8 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-xl hover:-translate-y-1 active:scale-95"
                >
                    + Post New Summary
                </button>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">News Topic / Name</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Content Status</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Attachments</th>
                                <th className="px-6 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {newspapers.map((newspaper) => (
                                <tr key={newspaper._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900">{newspaper.name}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-tight">{formatDate(newspaper.date)}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-green-100">
                                            {newspaper.summary ? 'Summary Written' : 'Empty'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {newspaper.fileUrl ? (
                                            <span className="text-[10px] font-black text-blue-500 uppercase flex items-center gap-1">
                                                📎 {newspaper.fileType.toUpperCase()}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-black text-gray-300 uppercase">None</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => handleEdit(newspaper)}
                                                className="w-9 h-9 flex items-center justify-center bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-900 hover:text-white transition-all"
                                                title="Edit"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDelete(newspaper._id)}
                                                className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-5xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col border border-white/20 scale-in-center">
                        <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                    {editingNewspaper ? 'Edit News Summary' : 'Post New News Summary'}
                                </h2>
                                <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-widest">
                                    Format your news with topics for students
                                </p>
                            </div>
                            <button onClick={handleCloseModal} className="w-10 h-10 flex items-center justify-center bg-gray-200 hover:bg-red-500 hover:text-white rounded-full transition-all duration-300">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
                                {/* Form Fields */}
                                <div className="lg:col-span-12 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Headline / Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="e.g., Daily Exam News - Dec 10"
                                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl font-bold text-gray-900 outline-none transition-all placeholder:text-gray-300"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Date of News</label>
                                            <input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl font-bold text-gray-900 outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Summarized News (Topic-Wise)</label>
                                        <p className="text-[10px] text-blue-500 font-bold uppercase mb-2">Tip: Use # for Topics and * for Bullted points</p>
                                        <textarea
                                            value={formData.summary}
                                            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                                            placeholder={`Example:\n# NATIONAL AFFAIRS\n* Government launches new scheme...\n\n# ECONOMY\n* RBI maintains repo rate...`}
                                            className="w-full h-96 px-6 py-6 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[2rem] font-medium text-gray-700 outline-none transition-all resize-none shadow-inner leading-relaxed text-lg"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Optional PDF/Image Upload</label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    onChange={handleFileChange}
                                                    accept=".pdf,image/*"
                                                    className="w-full px-6 py-4 bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl font-bold text-gray-500 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <button
                                                type="submit"
                                                className="flex-1 px-8 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-black transition-all shadow-xl shadow-blue-200"
                                            >
                                                {editingNewspaper ? 'Update Content' : 'Publish to Website'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleCloseModal}
                                                className="px-8 py-5 bg-gray-100 text-gray-400 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-red-50 hover:text-red-500 transition-all"
                                            >
                                                Discard
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
