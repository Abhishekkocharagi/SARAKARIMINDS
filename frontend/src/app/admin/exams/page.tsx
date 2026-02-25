'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { FiTrash2 } from 'react-icons/fi';
import { API_BASE_URL } from '@/config';

interface Exam {
    _id: string;
    name: string;
    fullName: string;
    conductingBody: string;
    examLevel: string;
    category: string;
    language: string;
    examType: string;
    status: string;
}

export default function AdminExamsPage() {
    const { user } = useAuth();
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Add Exam State
    const [showAddModal, setShowAddModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newExam, setNewExam] = useState({
        name: '',
        fullName: '',
        conductingBody: '',
        examLevel: 'State',
        category: '',
        language: 'en',
        examType: 'Competitive',
        status: 'active'
    });

    const handleDeleteExam = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete "${name}"? This will permanently remove all related updates and documents.`)) return;

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/exams/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${user?.token}`
                }
            });
            if (res.ok) {
                alert('Exam deleted successfully');
                fetchExams();
            } else {
                const error = await res.json();
                alert(error.message || 'Failed to delete exam');
            }
        } catch (error) {
            console.error('Error deleting exam:', error);
        }
    };

    const handleCreateExam = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/exams`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user?.token}`
                },
                body: JSON.stringify(newExam)
            });
            if (res.ok) {
                const data = await res.json();
                setShowAddModal(false);
                fetchExams();
                setNewExam({
                    name: '',
                    fullName: '',
                    conductingBody: '',
                    examLevel: 'State',
                    category: '',
                    language: 'en',
                    examType: 'Competitive',
                    status: 'active'
                });
            } else {
                const error = await res.json();
                alert(error.message || 'Failed to create exam');
            }
        } catch (error) {
            console.error('Error creating exam:', error);
        } finally {
            setCreating(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/exams`, {
                headers: {
                    'Authorization': `Bearer ${user?.token}`
                }
            });
            if (res.ok) {
                const data = await res.json();
                setExams(data);
            }
        } catch (error) {
            console.error('Error fetching exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredExams = exams.filter(exam =>
        exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Exam Ecosystem</h1>
                    <p className="text-gray-500 mt-1">Manage exam master details, content, updates, and documents.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-64">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Search exams..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-gray-200 pl-11 pr-4 py-3 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-blue-600 hover:bg-black text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition shadow-lg shadow-blue-500/20"
                    >
                        + Add New Exam
                    </button>
                </div>
            </div>

            {/* Add Exam Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-10 overflow-hidden relative shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-300">
                        <h2 className="text-3xl font-black text-gray-900 mb-2">Create New Exam</h2>
                        <p className="text-sm text-gray-400 font-bold mb-8 uppercase tracking-widest">Initialization Master Portal</p>

                        <form onSubmit={handleCreateExam} className="grid grid-cols-2 gap-6">
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Short Name (Tag)</label>
                                <input
                                    type="text"
                                    required
                                    value={newExam.name}
                                    onChange={(e) => setNewExam({ ...newExam, name: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-600"
                                    placeholder="e.g., KAS"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Conducting Body</label>
                                <input
                                    type="text"
                                    required
                                    value={newExam.conductingBody}
                                    onChange={(e) => setNewExam({ ...newExam, conductingBody: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-600"
                                    placeholder="e.g., KPSC"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Exam Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newExam.fullName}
                                    onChange={(e) => setNewExam({ ...newExam, fullName: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-600"
                                    placeholder="e.g., Karnataka Administrative Services"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Exam Level</label>
                                <select
                                    value={newExam.examLevel}
                                    onChange={(e) => setNewExam({ ...newExam, examLevel: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    <option value="State">State</option>
                                    <option value="Central">Central</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Category</label>
                                <input
                                    type="text"
                                    required
                                    value={newExam.category}
                                    onChange={(e) => setNewExam({ ...newExam, category: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-600"
                                    placeholder="e.g., Civil Services"
                                />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Status</label>
                                <select
                                    value={newExam.status}
                                    onChange={(e) => setNewExam({ ...newExam, status: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    <option value="active">Active (Visible in Preferences)</option>
                                    <option value="inactive">Inactive (Hidden)</option>
                                </select>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Exam Type</label>
                                <select
                                    value={newExam.examType}
                                    onChange={(e) => setNewExam({ ...newExam, examType: e.target.value })}
                                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-blue-600"
                                >
                                    <option value="Competitive">Competitive</option>
                                    <option value="Qualification">Qualification</option>
                                    <option value="Departmental">Departmental</option>
                                </select>
                            </div>
                            <div className="col-span-2 flex gap-4 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-gray-400 bg-gray-50 hover:bg-gray-100 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 bg-gray-900 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition shadow-xl shadow-gray-200 disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Initialize Exam'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-gray-500 font-bold">Loading exams...</div>
                ) : filteredExams.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-400 font-bold">No exams found. {exams.length === 0 ? "Ensure they are seeded." : "Try a different search."}</div>
                ) : (
                    filteredExams.map((exam) => (
                        <div key={exam._id} className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${exam.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                        {exam.status}
                                    </span>
                                    <h2 className="text-2xl font-black text-gray-900 mt-2">{exam.name}</h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{exam.conductingBody}</p>
                                </div>
                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-2xl overflow-hidden border border-gray-100">
                                    {(exam as any).logoUrl ? (
                                        <img src={(exam as any).logoUrl} alt={exam.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="grayscale opacity-50">🏛️</span>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => handleDeleteExam(exam._id, exam.name)}
                                className="absolute top-4 right-4 w-8 h-8 bg-white border border-red-100 rounded-full flex items-center justify-center text-red-500 shadow-sm opacity-10 group-hover:opacity-100 transition hover:bg-red-50 z-10"
                                title="Delete Exam"
                            >
                                <FiTrash2 size={14} />
                            </button>

                            <p className="text-sm text-gray-600 font-medium mb-6 line-clamp-2 h-10">
                                {exam.fullName}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-gray-50 p-3 rounded-xl">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Level</p>
                                    <p className="text-xs font-black text-gray-800">{exam.examLevel}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-xl">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Category</p>
                                    <p className="text-xs font-black text-gray-800">{exam.category}</p>
                                </div>
                            </div>

                            <Link
                                href={`/admin/exams/${exam._id}`}
                                className="block w-full text-center bg-gray-900 hover:bg-blue-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition shadow-lg shadow-gray-200"
                            >
                                Manage Exam
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
