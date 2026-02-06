'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

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

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await fetch('http://localhost:5000/api/admin/exams', {
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
                <div className="relative w-full max-w-sm">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Search exams by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-gray-200 pl-11 pr-4 py-3 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-gray-500 font-bold">Loading exams...</div>
                ) : filteredExams.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-400 font-bold">No exams found. {exams.length === 0 ? "Ensure they are seeded." : "Try a different search."}</div>
                ) : (
                    filteredExams.map((exam) => (
                        <div key={exam._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition group">
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
