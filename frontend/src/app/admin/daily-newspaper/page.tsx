'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AdminDailyNewspaperPage() {
    const { user } = useAuth();
    const [newspapers, setNewspapers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNewspaper, setEditingNewspaper] = useState<any>(null);
    const [previewUrl, setPreviewUrl] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        date: new Date().toISOString().split('T')[0],
        fileUrl: '',
        fileType: 'pdf' as 'pdf' | 'image',
        thumbnailUrl: ''
    });

    useEffect(() => {
        fetchNewspapers();
    }, []);

    const fetchNewspapers = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/daily-newspapers/admin/all', {
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
                ? `http://localhost:5000/api/daily-newspapers/admin/${editingNewspaper._id}`
                : 'http://localhost:5000/api/daily-newspapers/admin';

            const method = editingNewspaper ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                await fetchNewspapers();
                handleCloseModal();
                alert(editingNewspaper ? 'Newspaper updated successfully!' : 'Newspaper created successfully!');
            } else {
                alert('Failed to save newspaper');
            }
        } catch (error) {
            console.error('Error saving newspaper:', error);
            alert('Error saving newspaper');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this newspaper?')) return;

        try {
            const res = await fetch(`http://localhost:5000/api/daily-newspapers/admin/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });

            if (res.ok) {
                await fetchNewspapers();
                alert('Newspaper deleted successfully!');
            }
        } catch (error) {
            console.error('Error deleting newspaper:', error);
            alert('Error deleting newspaper');
        }
    };

    const handleToggleVisibility = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:5000/api/daily-newspapers/admin/${id}/toggle-visibility`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${user?.token}` }
            });

            if (res.ok) {
                await fetchNewspapers();
            }
        } catch (error) {
            console.error('Error toggling visibility:', error);
        }
    };

    const handleEdit = (newspaper: any) => {
        setEditingNewspaper(newspaper);
        setFormData({
            name: newspaper.name,
            date: new Date(newspaper.date).toISOString().split('T')[0],
            fileUrl: newspaper.fileUrl,
            fileType: newspaper.fileType,
            thumbnailUrl: newspaper.thumbnailUrl || ''
        });
        setPreviewUrl(newspaper.fileType === 'pdf' ? newspaper.thumbnailUrl : newspaper.fileUrl);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingNewspaper(null);
        setFormData({
            name: '',
            date: new Date().toISOString().split('T')[0],
            fileUrl: '',
            fileType: 'pdf',
            thumbnailUrl: ''
        });
        setPreviewUrl('');
    };

    const handleFileUrlChange = (url: string) => {
        setFormData({ ...formData, fileUrl: url });

        // Auto-detect file type
        const lowerUrl = url.toLowerCase();
        if (lowerUrl.endsWith('.pdf')) {
            setFormData(prev => ({ ...prev, fileUrl: url, fileType: 'pdf' }));
        } else if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
            setFormData(prev => ({ ...prev, fileUrl: url, fileType: 'image' }));
            setPreviewUrl(url);
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">📰 Daily Newspaper</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage daily newspapers for students</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
                >
                    + Add Newspaper
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <p className="text-sm text-gray-500 font-bold uppercase">Total Newspapers</p>
                    <p className="text-3xl font-black text-gray-900 mt-2">{newspapers.length}</p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <p className="text-sm text-gray-500 font-bold uppercase">Visible</p>
                    <p className="text-3xl font-black text-green-600 mt-2">
                        {newspapers.filter(n => n.isVisible).length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <p className="text-sm text-gray-500 font-bold uppercase">Hidden</p>
                    <p className="text-3xl font-black text-gray-400 mt-2">
                        {newspapers.filter(n => !n.isVisible).length}
                    </p>
                </div>
            </div>

            {/* Newspapers Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Preview</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Views</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {newspapers.map((newspaper) => (
                                <tr key={newspaper._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden">
                                            {newspaper.fileType === 'image' ? (
                                                <img src={newspaper.fileUrl} alt={newspaper.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl">📄</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-900">{newspaper.name}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600">{formatDate(newspaper.date)}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${newspaper.fileType === 'pdf' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {newspaper.fileType}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600">{newspaper.views?.length || 0}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleVisibility(newspaper._id)}
                                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase transition-all ${newspaper.isVisible
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }`}
                                        >
                                            {newspaper.isVisible ? '👁️ Visible' : '🚫 Hidden'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(newspaper)}
                                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-200 transition-all"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(newspaper._id)}
                                                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-all"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {newspapers.length === 0 && (
                        <div className="text-center py-12 text-gray-400">
                            <p className="text-4xl mb-4">📰</p>
                            <p className="font-bold">No newspapers yet</p>
                            <p className="text-sm mt-1">Click "Add Newspaper" to create one</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl">
                        <div className="p-8 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                                    {editingNewspaper ? 'Edit Newspaper' : 'Add New Newspaper'}
                                </h2>
                                <p className="text-xs text-gray-400 font-bold uppercase mt-1">
                                    Upload PDF or Image files
                                </p>
                            </div>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Column - Form */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                            Newspaper Name *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., The Hindu - Karnataka Edition"
                                            className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                            Date *
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                            File Type *
                                        </label>
                                        <select
                                            value={formData.fileType}
                                            onChange={(e) => setFormData({ ...formData, fileType: e.target.value as 'pdf' | 'image' })}
                                            className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                            <option value="pdf">PDF</option>
                                            <option value="image">Image (JPG/PNG)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                            File URL *
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.fileUrl}
                                            onChange={(e) => handleFileUrlChange(e.target.value)}
                                            placeholder="https://example.com/newspaper.pdf"
                                            className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                            required
                                        />
                                        <p className="text-xs text-gray-400 mt-1 italic">
                                            Upload file to cloud storage and paste URL here
                                        </p>
                                    </div>

                                    {formData.fileType === 'pdf' && (
                                        <div>
                                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
                                                Thumbnail URL (Optional)
                                            </label>
                                            <input
                                                type="url"
                                                value={formData.thumbnailUrl}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, thumbnailUrl: e.target.value });
                                                    setPreviewUrl(e.target.value);
                                                }}
                                                placeholder="https://example.com/thumbnail.jpg"
                                                className="w-full px-4 py-3 bg-gray-50 border rounded-xl font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <p className="text-xs text-gray-400 mt-1 italic">
                                                First page preview image for PDF
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column - Preview */}
                                <div className="bg-gray-50 rounded-xl p-6 flex flex-col items-center justify-center">
                                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Live Preview</p>
                                    {previewUrl ? (
                                        <div className="w-full h-96 bg-white rounded-xl overflow-hidden shadow-lg">
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
                                        </div>
                                    ) : formData.fileType === 'pdf' ? (
                                        <div className="w-full h-96 bg-white rounded-xl flex items-center justify-center text-gray-300">
                                            <div className="text-center">
                                                <p className="text-6xl mb-4">📄</p>
                                                <p className="text-sm font-bold">PDF Preview</p>
                                                <p className="text-xs mt-1">Add thumbnail URL to see preview</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="w-full h-96 bg-white rounded-xl flex items-center justify-center text-gray-300">
                                            <div className="text-center">
                                                <p className="text-6xl mb-4">🖼️</p>
                                                <p className="text-sm font-bold">Image Preview</p>
                                                <p className="text-xs mt-1">Add file URL to see preview</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8 pt-6 border-t">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl font-black uppercase text-sm tracking-widest hover:bg-blue-700 transition-all shadow-xl"
                                >
                                    {editingNewspaper ? 'Update Newspaper' : 'Create Newspaper'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-6 py-4 bg-gray-100 text-gray-600 rounded-xl font-black uppercase text-sm tracking-widest hover:bg-gray-200 transition-all"
                                >
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
